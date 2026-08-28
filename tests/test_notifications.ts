import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole, transitionPotholeStatus, assignPothole } from '../src/services/pothole.service';
import { escalateStaleReports } from '../src/services/escalation.service';
import { createNotification, sendVerificationNotification, sendFixedNotification, sendRejectedNotification, sendOngoingNotification } from '../src/services/notification.service';
import { MunicipalityRole, Status, Role } from '@prisma/client';

// Mock BullMQ Queue to avoid requiring Redis connection during tests
(global as any).potholeQueue = {
    add: async (name: string, data: any) => {
        console.log(`[Mock Queue] Enqueued background job: ${name}`, data);
        return { id: 'mock-job-id' };
    },
    close: async () => {},
};

async function main() {
    console.log('=== STARTING NOTIFICATION AND ESCALATION TESTS ===\n');

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const citizenEmail = 'ayushkmishra332+citizen@gmail.com';
    const officerEmail = 'ayushkmishra332+officer@gmail.com';
    const managerEmail = 'ayushkmishra332+manager@gmail.com';
    const adminEmail = 'ayushkmishra332+admin@gmail.com';
    const munName = 'Notification Test City';

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.notification.deleteMany({
        where: { user: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.reportStatusHistory.deleteMany({
        where: { actor: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.reportAssignment.deleteMany({
        where: { officer: { email: { in: [officerEmail] } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Create users and municipality
    console.log('Step 2: Creating mock municipality and users...');
    const municipality = await createMunicipality({ name: munName });

    // Citizen
    const citizenUser = await db.user.create({
        data: {
            name: 'Notify Citizen',
            email: citizenEmail,
            emailVerified: true,
            role: Role.USER,
        },
    });

    // Officer
    const officerUser = await db.user.create({
        data: {
            name: 'Notify Officer',
            email: officerEmail,
            emailVerified: true,
            role: Role.USER,
        },
    });
    await addMunicipalityMember({
        userId: officerUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });

    // Manager
    const managerUser = await db.user.create({
        data: {
            name: 'Notify Manager',
            email: managerEmail,
            emailVerified: true,
            role: Role.USER,
        },
    });
    await addMunicipalityMember({
        userId: managerUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.MANAGER,
    });

    // Admin
    const adminUser = await db.user.create({
        data: {
            name: 'Notify Admin',
            email: adminEmail,
            emailVerified: true,
            role: Role.ADMIN,
        },
    });

    // Create a pothole reported by citizen
    const pothole = await createPothole({
        title: 'Notification Test Pothole',
        description: 'Testing persistent notifications',
        severity: 3,
        latitude: 13.0827,
        longitude: 80.2707,
        locationSource: 'GPS',
        userId: citizenUser.id,
    });
    // Link it to the municipality
    await db.pothole.update({
        where: { id: pothole.id },
        data: { municipalityId: municipality.id },
    });

    console.log(`- Created Pothole ID: ${pothole.id}`);
    console.log(`- Citizen: ${citizenUser.id}`);
    console.log(`- Officer: ${officerUser.id}`);
    console.log(`- Manager: ${managerUser.id}`);
    console.log(`- Admin: ${adminUser.id}\n`);

    // 3. Test Direct Notification persistence
    console.log('Step 3: Verifying persistence of direct notifications...');
    await createNotification({
        userId: citizenUser.id,
        title: 'Custom Alert',
        message: 'This is a test notification.',
        link: '/test',
    });

    const citizenNotifications = await db.notification.findMany({
        where: { userId: citizenUser.id },
    });

    if (citizenNotifications.length !== 1 || citizenNotifications[0].title !== 'Custom Alert') {
        throw new Error('Direct notification creation failed or query returned incorrect values');
    }
    console.log('  [OK] Custom notification saved successfully.');

    // Mark as read
    await db.notification.update({
        where: { id: citizenNotifications[0].id },
        data: { read: true },
    });
    const updatedNotif = await db.notification.findFirst({
        where: { id: citizenNotifications[0].id },
    });
    if (!updatedNotif || !updatedNotif.read) {
        throw new Error('Failed to mark notification as read');
    }
    console.log('  [OK] Notification successfully marked as read.\n');

    // 4. Test Lifecycle Transition Notification Triggers
    console.log('Step 4: Testing lifecycle transition notification triggers...');
    
    // A. Transition PENDING -> VERIFIED
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.VERIFIED,
        actorId: officerUser.id,
        reason: 'Pothole verified by officer.',
    });
    await delay(3000);

    const verifiedNotification = await db.notification.findFirst({
        where: { userId: citizenUser.id, title: 'Pothole Report Verified' },
    });
    if (!verifiedNotification) {
        throw new Error('Citizen was not notified when report transitioned to VERIFIED');
    }
    console.log('  [OK] Citizen notified for VERIFIED transition.');

    // B. Assign to Officer (Transitions status to ONGOING and notifies officer + citizen)
    await assignPothole({
        potholeId: pothole.id,
        officerId: officerUser.id,
        actorId: managerUser.id,
        actorRole: 'USER',
    });
    await delay(3000);

    const officerNotification = await db.notification.findFirst({
        where: { userId: officerUser.id, title: 'New Pothole Assigned' },
    });
    if (!officerNotification || !officerNotification.message.includes('Notification Test Pothole')) {
        throw new Error('Officer was not notified of new assignment');
    }
    console.log('  [OK] Officer notified of assignment.');

    const ongoingNotification = await db.notification.findFirst({
        where: { userId: citizenUser.id, title: 'Work Started on Pothole' },
    });
    if (!ongoingNotification) {
        throw new Error('Citizen was not notified when report transitioned to ONGOING due to assignment');
    }
    console.log('  [OK] Citizen notified of ONGOING transition due to assignment.');

    // C. Transition ONGOING -> FIXED
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.FIXED,
        actorId: officerUser.id,
        reason: 'Pothole fixed.',
    });
    await delay(3000);

    const fixedNotification = await db.notification.findFirst({
        where: { userId: citizenUser.id, title: 'Pothole Marked as Fixed!' },
    });
    if (!fixedNotification) {
        throw new Error('Citizen was not notified when report transitioned to FIXED');
    }
    console.log('  [OK] Citizen notified of FIXED transition.\n');

    // 5. Test Escalation Logic
    console.log('Step 5: Testing escalation logic for stale pending reports...');
    
    // Create another pothole and keep it PENDING
    const stalePothole = await createPothole({
        title: 'Stale Pothole Report',
        description: 'Waiting for review for too long',
        severity: 5,
        latitude: 13.0827,
        longitude: 80.2707,
        locationSource: 'GPS',
        userId: citizenUser.id,
    });
    // Route it to the municipality
    await db.pothole.update({
        where: { id: stalePothole.id },
        data: { municipalityId: municipality.id },
    });

    // Manually update the createdAt timestamp using raw SQL to make it stale (e.g. 72 hours ago)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 72);
    
    // Force updating createdAt
    await db.$executeRawUnsafe(
        'UPDATE "Pothole" SET "createdAt" = $1 WHERE "id" = $2',
        pastDate,
        stalePothole.id
    );

    // Verify it is updated
    const fetchedStale = await db.pothole.findUnique({ where: { id: stalePothole.id } });
    if (!fetchedStale || fetchedStale.createdAt.getTime() > pastDate.getTime() + 1000) {
        throw new Error('Failed to set mock stale report createdAt time via raw query');
    }
    console.log(`  - Mock stale report created at: ${fetchedStale.createdAt.toISOString()}`);

    // Trigger escalation check (48h threshold)
    console.log('  - Running escalation checks...');
    const escalatedCount = await escalateStaleReports(48);
    if (escalatedCount === 0) {
        throw new Error('No reports were escalated (expected at least 1)');
    }
    console.log(`  - Escalated count: ${escalatedCount} report(s).`);

    // Check that manager was notified
    const managerEscalation = await db.notification.findFirst({
        where: { userId: managerUser.id, title: 'Escalation: Stale Pothole Report' },
    });
    if (!managerEscalation || !managerEscalation.message.includes('Stale Pothole Report')) {
        throw new Error('Manager was not notified of the escalated stale report');
    }
    console.log('  [OK] Municipality Manager successfully notified of escalated report.');

    // Check report status
    const verifiedEscalatedReport = await db.pothole.findUnique({ where: { id: stalePothole.id } });
    if (!verifiedEscalatedReport || !verifiedEscalatedReport.escalated) {
        throw new Error('Report escalated flag was not set to true');
    }
    console.log('  [OK] Report escalated flag set to true.');

    // Try to run escalation again (should not escalate again as escalated = true)
    const secondaryCount = await escalateStaleReports(48);
    if (secondaryCount !== 0) {
        throw new Error(`Report was escalated twice! Received escalated count: ${secondaryCount}`);
    }
    console.log('  [OK] Stale reports are not escalated multiple times.\n');

    // 6. Clean up database
    console.log('Step 6: Cleaning up mock test records...');
    await db.notification.deleteMany({
        where: { user: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.reportStatusHistory.deleteMany({
        where: { actor: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.reportAssignment.deleteMany({
        where: { officer: { email: { in: [officerEmail] } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
    });
    await db.municipalityMember.deleteMany({
        where: { userId: { in: [officerUser.id, managerUser.id] } },
    });
    await db.user.deleteMany({
        where: { id: { in: [citizenUser.id, officerUser.id, managerUser.id, adminUser.id] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL NOTIFICATION AND ESCALATION TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
