import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole, assignPothole } from '../src/services/pothole.service';
import { MunicipalityRole, Status } from '@prisma/client';

async function main() {
    console.log('=== STARTING POTHOLE ASSIGNMENT INTEGRATION TESTS ===\n');

    const citizenEmail = 'citizen.assign@pothole.in';
    const officer1Email = 'officer1.assign@pothole.in';
    const officer2Email = 'officer2.assign@pothole.in';
    const managerEmail = 'manager.assign@pothole.in';
    const unaffiliatedEmail = 'unaffiliated.assign@pothole.in';
    const munName = 'Assignment Test City';

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.reportAssignment.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officer1Email, officer2Email, managerEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officer1Email, officer2Email, managerEmail, unaffiliatedEmail] } },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Create users and municipality
    console.log('Step 2: Creating mock municipality, users, and members...');
    const municipality = await createMunicipality({ name: munName });

    // Citizen
    const citizenUser = await db.user.create({
        data: {
            name: 'Assignment Citizen',
            email: citizenEmail,
            emailVerified: true,
        },
    });

    // Officer 1
    const officer1User = await db.user.create({
        data: {
            name: 'Assignment Officer 1',
            email: officer1Email,
            emailVerified: true,
        },
    });
    await addMunicipalityMember({
        userId: officer1User.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });

    // Officer 2
    const officer2User = await db.user.create({
        data: {
            name: 'Assignment Officer 2',
            email: officer2Email,
            emailVerified: true,
        },
    });
    await addMunicipalityMember({
        userId: officer2User.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });

    // Manager
    const managerUser = await db.user.create({
        data: {
            name: 'Assignment Manager',
            email: managerEmail,
            emailVerified: true,
        },
    });
    await addMunicipalityMember({
        userId: managerUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.MANAGER,
    });

    // Unaffiliated User
    const unaffiliatedUser = await db.user.create({
        data: {
            name: 'Unaffiliated Citizen',
            email: unaffiliatedEmail,
            emailVerified: true,
        },
    });

    // Create target pothole inside municipality and set to VERIFIED
    const pothole = await createPothole({
        title: 'Assignment Test Pothole',
        description: 'Testing task assignment flow',
        severity: 4,
        latitude: 12.9716,
        longitude: 77.5946,
        locationSource: 'GPS' as const,
        userId: citizenUser.id,
    });
    // Manually assign to municipality and verify status
    await db.pothole.update({
        where: { id: pothole.id },
        data: { 
            municipalityId: municipality.id,
            status: Status.VERIFIED,
        },
    });

    console.log(`- Created Pothole ID: ${pothole.id} (Status: VERIFIED)`);
    console.log(`- Officer 1 ID: ${officer1User.id}`);
    console.log(`- Officer 2 ID: ${officer2User.id}`);
    console.log(`- Manager ID: ${managerUser.id}\n`);

    // 3. Test Citizen Assignment block
    console.log('Step 3: Verifying that citizens cannot assign reports...');
    try {
        await assignPothole({
            potholeId: pothole.id,
            officerId: officer1User.id,
            actorId: citizenUser.id,
            actorRole: 'USER',
        });
        throw new Error('Citizen was able to assign pothole! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('managers') || err.message.includes('Forbidden') || err.statusCode === 403) {
            console.log('  [OK] Citizen assignment block worked as expected:', err.message);
        } else {
            throw err;
        }
    }

    // 4. Test Officer Assignment block
    console.log('Step 4: Verifying that Officers cannot assign reports...');
    try {
        await assignPothole({
            potholeId: pothole.id,
            officerId: officer2User.id,
            actorId: officer1User.id,
            actorRole: 'USER',
        });
        throw new Error('Officer was able to assign pothole! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('managers') || err.message.includes('Forbidden') || err.statusCode === 403) {
            console.log('  [OK] Officer assignment block worked as expected:', err.message);
        } else {
            throw err;
        }
    }

    // 5. Test Manager Assigning to unaffiliated user (should fail)
    console.log('Step 5: Verifying assignment to non-municipality member is blocked...');
    try {
        await assignPothole({
            potholeId: pothole.id,
            officerId: unaffiliatedUser.id,
            actorId: managerUser.id,
            actorRole: 'USER',
        });
        throw new Error('Manager assigned pothole to unaffiliated user! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('not a municipality member') || err.statusCode === 400) {
            console.log('  [OK] Unaffiliated user block worked as expected:', err.message);
        } else {
            throw err;
        }
    }

    // 6. Test Valid Manager Assignment to Officer 1
    console.log('\nStep 6: Testing valid Manager assignment to Officer 1...');
    let updated = await assignPothole({
        potholeId: pothole.id,
        officerId: officer1User.id,
        actorId: managerUser.id,
        actorRole: 'USER',
    });

    console.log(`  - Pothole assigned to Officer 1. Current Status: ${updated.status}`);
    if (updated.assignedOfficerId !== officer1User.id) {
        throw new Error('assignedOfficerId was not set correctly');
    }
    if (updated.status !== Status.ONGOING) {
        throw new Error('Status was not automatically transitioned to ONGOING');
    }
    console.log('  [OK] assignedOfficerId set and status transitioned to ONGOING successfully.');

    // Check history logs
    let assignmentHistory = await db.reportAssignment.findFirst({
        where: { potholeId: pothole.id, officerId: officer1User.id },
    });
    if (!assignmentHistory || assignmentHistory.assignedById !== managerUser.id) {
        throw new Error('ReportAssignment history log is missing or incorrect');
    }
    console.log('  [History Log Verified] Logged: Assigned to Officer 1 by Manager');

    let statusHistory = await db.reportStatusHistory.findFirst({
        where: { potholeId: pothole.id, oldStatus: Status.VERIFIED, newStatus: Status.ONGOING },
    });
    if (!statusHistory) {
        throw new Error('Status history log for automated transition is missing');
    }
    console.log('  [History Log Verified] Logged: Status VERIFIED -> ONGOING (Automated)\n');

    // 7. Test Reassignment to Officer 2
    console.log('Step 7: Testing reassignment to Officer 2 by Manager...');
    updated = await assignPothole({
        potholeId: pothole.id,
        officerId: officer2User.id,
        actorId: managerUser.id,
        actorRole: 'USER',
    });

    console.log(`  - Pothole reassigned to Officer 2. Current Status: ${updated.status}`);
    if (updated.assignedOfficerId !== officer2User.id) {
        throw new Error('assignedOfficerId was not updated correctly');
    }

    // Check assignment history
    const assignmentsCount = await db.reportAssignment.count({
        where: { potholeId: pothole.id },
    });
    if (assignmentsCount !== 2) {
        throw new Error(`Expected 2 assignments logged in history, got ${assignmentsCount}`);
    }
    console.log('  [History Log Verified] Total assignments logged: 2 (Immutable history verified)\n');

    // 8. Clean up records
    console.log('Step 8: Cleaning up mock test records...');
    await db.reportAssignment.deleteMany({
        where: { potholeId: pothole.id },
    });
    await db.reportStatusHistory.deleteMany({
        where: { potholeId: pothole.id },
    });
    await db.pothole.delete({
        where: { id: pothole.id },
    });
    await db.municipalityMember.deleteMany({
        where: { userId: { in: [officer1User.id, officer2User.id, managerUser.id] } },
    });
    await db.user.deleteMany({
        where: { id: { in: [citizenUser.id, officer1User.id, officer2User.id, managerUser.id, unaffiliatedUser.id] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL POTHOLE ASSIGNMENT TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
