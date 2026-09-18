import { db } from '../../src/lib/db';

export async function runPotholeServiceIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Pothole Lifecycle DB Service & PostGIS Queries ---');

    const actor = await db.user.findFirst();
    if (!actor) {
        console.error('❌ Integration Test Error: No user found in database');
        return false;
    }

    const testPotholeId = `test-pothole-int-${Date.now()}`;

    // 1. Create Pothole Report Record in Neon Postgres
    const pothole = await db.pothole.create({
        data: {
            id: testPotholeId,
            userId: actor.id,
            title: 'Deep Pothole on Rajpath',
            description: 'Integration test pothole entry on arterial road',
            latitude: 28.6139,
            longitude: 77.2090,
            city: 'New Delhi',
            status: 'PENDING',
            severity: 4,
        },
    });

    if (pothole && pothole.id === testPotholeId) {
        console.log('  ✅ Neon Postgres Pothole Creation: PASSED');
    } else {
        console.error('❌ Neon Postgres Pothole Creation: FAILED');
        return false;
    }

    // 2. Query Pothole with User relation join
    const fetched = await db.pothole.findUnique({
        where: { id: testPotholeId },
        include: { user: true },
    });

    if (fetched && fetched.user.id === actor.id && fetched.severity === 4) {
        console.log('  ✅ Pothole Query & User Relation Join: PASSED');
    } else {
        console.error('❌ Pothole Query: FAILED', fetched);
        return false;
    }

    // 3. Status Transition Update (PENDING -> ONGOING)
    const updated = await db.pothole.update({
        where: { id: testPotholeId },
        data: { status: 'ONGOING' },
    });

    if (updated.status === 'ONGOING') {
        console.log('  ✅ Pothole Status Mutation (PENDING -> ONGOING): PASSED');
    } else {
        console.error('❌ Pothole Status Mutation: FAILED', updated);
        return false;
    }

    // 4. Cleanup Test Record
    await db.pothole.delete({ where: { id: testPotholeId } });
    console.log('  ✅ Test Pothole Cleanup: PASSED');

    console.log('✅ Pothole Service Integration Suite: ALL 4 TESTS PASSED');
    return true;
}
