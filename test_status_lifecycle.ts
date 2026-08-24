import 'dotenv/config';
import { db } from './src/lib/db';
import { createMunicipality, addMunicipalityMember } from './src/services/municipality.service';
import { createPothole, transitionPotholeStatus } from './src/services/pothole.service';
import { MunicipalityRole, Status } from '@prisma/client';

async function main() {
    console.log('=== STARTING STATUS LIFECYCLE STATE MACHINE TESTS ===\n');

    const citizenEmail = 'citizen.lifecycle@pothole.in';
    const officerEmail = 'officer.lifecycle@pothole.in';
    const managerEmail = 'manager.lifecycle@pothole.in';
    const adminEmail = 'admin.lifecycle@pothole.in';
    const munName = 'Lifecycle Test City';

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.reportStatusHistory.deleteMany({
        where: { actor: { email: { in: [citizenEmail, officerEmail, managerEmail, adminEmail] } } },
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
    console.log('Step 2: Creating mock municipality, jurisdiction, and users...');
    const municipality = await createMunicipality({ name: munName });

    // Citizen
    const citizenUser = await db.user.create({
        data: {
            name: 'Lifecycle Citizen',
            email: citizenEmail,
            emailVerified: true,
        },
    });

    // Officer
    const officerUser = await db.user.create({
        data: {
            name: 'Lifecycle Officer',
            email: officerEmail,
            emailVerified: true,
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
            name: 'Lifecycle Manager',
            email: managerEmail,
            emailVerified: true,
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
            name: 'Platform Admin',
            email: adminEmail,
            emailVerified: true,
            role: 'ADMIN',
        },
    });

    // Create target pothole inside municipality
    const pothole = await createPothole({
        title: 'State Machine Test Pothole',
        description: 'Testing lifecycle validation',
        severity: 5,
        latitude: 12.9716,
        longitude: 77.5946,
        locationSource: 'GPS' as const,
        userId: citizenUser.id,
    });
    // Manually assign to municipality (since mock lat/lng doesn't contain a real PostGIS boundary unless configured)
    await db.pothole.update({
        where: { id: pothole.id },
        data: { municipalityId: municipality.id },
    });

    console.log(`- Created Pothole ID: ${pothole.id} (Status: ${pothole.status})`);
    console.log(`- Officer User ID: ${officerUser.id}`);
    console.log(`- Manager User ID: ${managerUser.id}\n`);

    // 3. Test Citizen restrictions (Citizens cannot update status)
    console.log('Step 3: Verifying that citizens cannot update status...');
    try {
        await transitionPotholeStatus({
            potholeId: pothole.id,
            newStatus: Status.VERIFIED,
            actorId: citizenUser.id,
        });
        throw new Error('Citizen was able to transition status! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('Forbidden') || err.status === 403) {
            console.log('  [OK] Citizen block worked successfully:', err.message);
        } else {
            throw err;
        }
    }

    // 4. Test Valid Officer Lifecycle Transitions
    console.log('\nStep 4: Testing valid Officer lifecycle path (PENDING -> VERIFIED -> ONGOING -> FIXED)...');
    
    // A. PENDING -> VERIFIED
    let updated = await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.VERIFIED,
        actorId: officerUser.id,
        reason: 'Pothole verified on-site by officer.',
    });
    console.log(`  - Transitioned to: ${updated.status} (Verified)`);
    
    let history = await db.reportStatusHistory.findFirst({
        where: { potholeId: pothole.id, newStatus: Status.VERIFIED },
    });
    if (!history || history.oldStatus !== Status.PENDING || history.actorId !== officerUser.id) {
        throw new Error('Status history log for VERIFIED is missing or incorrect');
    }
    console.log('    [History Log Verified] Logged: PENDING -> VERIFIED');

    // B. VERIFIED -> ONGOING
    updated = await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.ONGOING,
        actorId: officerUser.id,
        reason: 'Repair crew dispatched.',
    });
    console.log(`  - Transitioned to: ${updated.status} (Ongoing)`);

    history = await db.reportStatusHistory.findFirst({
        where: { potholeId: pothole.id, newStatus: Status.ONGOING },
    });
    if (!history || history.oldStatus !== Status.VERIFIED) {
        throw new Error('Status history log for ONGOING is missing or incorrect');
    }
    console.log('    [History Log Verified] Logged: VERIFIED -> ONGOING');

    // C. ONGOING -> FIXED
    updated = await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.FIXED,
        actorId: officerUser.id,
        reason: 'Asphalt filled and completed.',
    });
    console.log(`  - Transitioned to: ${updated.status} (Fixed)`);

    history = await db.reportStatusHistory.findFirst({
        where: { potholeId: pothole.id, newStatus: Status.FIXED },
    });
    if (!history || history.oldStatus !== Status.ONGOING) {
        throw new Error('Status history log for FIXED is missing or incorrect');
    }
    console.log('    [History Log Verified] Logged: ONGOING -> FIXED\n');

    // 5. Test Invalid Transition (e.g. going backward or skipping steps)
    console.log('Step 5: Testing invalid transition checks...');
    // Try to transition FIXED -> REJECTED (structurally invalid)
    try {
        await transitionPotholeStatus({
            potholeId: pothole.id,
            newStatus: Status.REJECTED,
            actorId: officerUser.id,
        });
        throw new Error('Allowed invalid transition! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('Invalid lifecycle transition')) {
            console.log('  [OK] Invalid transition check worked (blocked FIXED -> REJECTED):', err.message);
        } else {
            throw err;
        }
    }

    // 6. Test Reopening Restrictions
    console.log('\nStep 6: Testing reopening restrictions (FIXED -> PENDING)...');
    
    // A. Officer trying to reopen (should fail)
    try {
        await transitionPotholeStatus({
            potholeId: pothole.id,
            newStatus: Status.PENDING,
            actorId: officerUser.id,
            reason: 'Try to reopen by officer',
        });
        throw new Error('Officer reopened FIXED pothole! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('managers or administrators')) {
            console.log('  [OK] Officer block worked (blocked reopening by officer):', err.message);
        } else {
            throw err;
        }
    }

    // B. Manager reopening (should succeed)
    console.log('Attempting reopen with Manager role...');
    updated = await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.PENDING,
        actorId: managerUser.id,
        reason: 'Pothole sunk again after rain, reopening.',
    });
    console.log(`  - Transitioned to: ${updated.status} (Reopened successfully to PENDING)`);

    history = await db.reportStatusHistory.findFirst({
        where: { potholeId: pothole.id, oldStatus: Status.FIXED, newStatus: Status.PENDING },
    });
    if (!history || history.actorId !== managerUser.id) {
        throw new Error('Reopen history log is missing or incorrect');
    }
    console.log('    [History Log Verified] Logged: FIXED -> PENDING (Reopen)\n');

    // 7. Clean up database
    console.log('Step 7: Cleaning up mock test records...');
    await db.reportStatusHistory.deleteMany({
        where: { potholeId: pothole.id },
    });
    await db.pothole.delete({
        where: { id: pothole.id },
    });
    await db.municipalityMember.deleteMany({
        where: { userId: { in: [officerUser.id, managerUser.id] } },
    });
    await db.user.deleteMany({
        where: { id: { in: [citizenUser.id, officerUser.id, managerUser.id, adminUser.id] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL STATUS LIFECYCLE TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
