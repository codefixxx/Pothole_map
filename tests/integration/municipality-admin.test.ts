import { db } from '../../src/lib/db';
import { MunicipalityRole } from '@prisma/client';

export async function runMunicipalityAdminIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Super Admin Municipality & Member Management ---');

    let testMuniId: string | null = null;
    let testUserId: string | null = null;
    let testMemberId: string | null = null;

    try {
        // 1. Super Admin Create Municipality Test
        const testName = `Test Muni ${Date.now()}`;
        const muni = await db.municipality.create({
            data: {
                name: testName,
            },
        });
        testMuniId = muni.id;
        console.log(`  ✅ Create Municipality DB Relation: PASSED (ID: ${muni.id})`);

        // 2. Create Dummy Officer User & Member Link
        const dummyUser = await db.user.create({
            data: {
                name: 'Test Officer Integration',
                email: `officer.test.${Date.now()}@example.com`,
                emailVerified: true,
            },
        });
        testUserId = dummyUser.id;

        const member = await db.municipalityMember.create({
            data: {
                userId: dummyUser.id,
                municipalityId: muni.id,
                role: MunicipalityRole.OFFICER,
            },
        });
        testMemberId = member.id;
        console.log(`  ✅ Municipality Member Assignment (OFFICER): PASSED`);

        // 3. Promote Officer to MANAGER Role
        const updatedMember = await db.municipalityMember.update({
            where: { id: member.id },
            data: { role: MunicipalityRole.MANAGER },
        });

        if (updatedMember.role === MunicipalityRole.MANAGER) {
            console.log('  ✅ Municipality Member Role Promotion (MANAGER): PASSED');
        } else {
            console.error('❌ Member Role Promotion: FAILED');
            return false;
        }

        // 4. Query Municipality with Members Relation
        const muniWithMembers = await db.municipality.findUnique({
            where: { id: muni.id },
            include: { members: { include: { user: true } } },
        });

        if (muniWithMembers && muniWithMembers.members.length === 1) {
            console.log('  ✅ Query Municipality with Members Relation: PASSED');
        } else {
            console.error('❌ Query Municipality Members Relation: FAILED');
            return false;
        }

        // Cleanup
        await db.municipalityMember.delete({ where: { id: member.id } });
        await db.user.delete({ where: { id: dummyUser.id } });
        await db.municipality.delete({ where: { id: muni.id } });
        console.log('  ✅ Municipality Admin Test Cleanup: PASSED');

        console.log('✅ Municipality & Admin Management Integration Suite: ALL TESTS PASSED');
        return true;
    } catch (err) {
        console.error('❌ Municipality Admin Integration Test FAILED:', err);
        // Attempt cleanup on failure
        try {
            if (testMemberId) await db.municipalityMember.delete({ where: { id: testMemberId } });
            if (testUserId) await db.user.delete({ where: { id: testUserId } });
            if (testMuniId) await db.municipality.delete({ where: { id: testMuniId } });
        } catch {}
        return false;
    }
}
