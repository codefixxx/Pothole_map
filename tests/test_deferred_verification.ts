import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole } from '../src/services/pothole.service';
import { MunicipalityRole } from '@prisma/client';

async function main() {
    console.log('=== STARTING DEFERRED EMAIL VERIFICATION TESTS ===\n');

    const unverifiedEmail = 'unverified.test@pothole.in';
    const verifiedEmail = 'verified.test@pothole.in';
    const munName = 'Verification Test City';

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.pothole.deleteMany({
        where: { user: { email: { in: [unverifiedEmail, verifiedEmail] } } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [unverifiedEmail, verifiedEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [unverifiedEmail, verifiedEmail] } },
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

    const unverifiedUser = await db.user.create({
        data: {
            name: 'Unverified Citizen',
            email: unverifiedEmail,
            emailVerified: false,
        },
    });

    const verifiedUser = await db.user.create({
        data: {
            name: 'Verified Citizen',
            email: verifiedEmail,
            emailVerified: true,
        },
    });
    console.log(`- Unverified User ID: ${unverifiedUser.id}`);
    console.log(`- Verified User ID: ${verifiedUser.id}\n`);

    // 3. Test Pothole Reporting Guard
    console.log('Step 3: Testing pothole reporting restrictions...');
    const potholeData = {
        title: 'Unverified report pothole',
        description: 'Should fail on unverified',
        severity: 5,
        latitude: 12.9716,
        longitude: 77.5946,
        locationSource: 'GPS' as const,
    };

    // A. Unverified user reporting
    try {
        await createPothole({
            ...potholeData,
            userId: unverifiedUser.id,
        });
        throw new Error('Unverified user reported pothole successfully! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('verify your email address')) {
            console.log('  [OK] Unverified user block worked as expected:', err.message);
        } else {
            throw err;
        }
    }

    // B. Verified user reporting
    console.log('Testing reporting with verified user...');
    const pothole = await createPothole({
        ...potholeData,
        title: 'Verified report pothole',
        description: 'Should succeed on verified',
        userId: verifiedUser.id,
    });
    console.log(`  [OK] Verified user successfully reported pothole (ID: ${pothole.id}).\n`);

    // 4. Test Municipality Member Promotion Gate (Design Path 1)
    console.log('Step 4: Testing promotion restriction to municipality...');
    
    // A. Try to promote unverified user
    try {
        await addMunicipalityMember({
            userId: unverifiedUser.id,
            municipalityId: municipality.id,
            role: MunicipalityRole.OFFICER,
        });
        throw new Error('Unverified user promoted successfully! (Should have failed)');
    } catch (err: any) {
        if (err.message.includes('email address is not verified')) {
            console.log('  [OK] Unverified promotion block worked as expected:', err.message);
        } else {
            throw err;
        }
    }

    // B. Promote verified user
    console.log('Promoting verified user...');
    const member = await addMunicipalityMember({
        userId: verifiedUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });
    console.log(`  [OK] Verified user successfully promoted (Member ID: ${member.id}).\n`);

    // 5. Clean up records
    console.log('Step 5: Cleaning up records...');
    await db.pothole.deleteMany({
        where: { id: pothole.id },
    });
    await db.municipalityMember.deleteMany({
        where: { id: member.id },
    });
    await db.user.deleteMany({
        where: { id: { in: [unverifiedUser.id, verifiedUser.id] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL DEFERRED EMAIL VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
