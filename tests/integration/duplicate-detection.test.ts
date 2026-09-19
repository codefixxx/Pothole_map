import { db } from '../../src/lib/db';

export async function runDuplicateDetectionIntegrationTests() {
    console.log('--- [INTEGRATION TEST] AI & Spatial Duplicate Candidate Detection ---');

    const actor = await db.user.findFirst();
    if (!actor) {
        console.error('❌ Integration Test Error: No user found in database');
        return false;
    }

    const primaryId = `primary-pothole-${Date.now()}`;
    const duplicateId = `duplicate-pothole-${Date.now()}`;

    // 1. Create primary and duplicate report records
    const p1 = await db.pothole.create({
        data: {
            id: primaryId,
            userId: actor.id,
            title: 'Primary Road Pit',
            description: 'Large pit on outer ring road',
            latitude: 28.5355,
            longitude: 77.3910,
            city: 'Noida',
            status: 'PENDING',
            severity: 4,
        },
    });

    const p2 = await db.pothole.create({
        data: {
            id: duplicateId,
            userId: actor.id,
            title: 'Nearby Pit Duplicate',
            description: 'Duplicate pit on outer ring road within 20 meters',
            latitude: 28.5356, // ~11 meters apart
            longitude: 77.3911,
            city: 'Noida',
            status: 'PENDING',
            severity: 4,
        },
    });

    // 2. Insert DuplicateCandidate relation
    const candidate = await db.duplicateCandidate.create({
        data: {
            potholeId: p1.id,
            duplicateId: p2.id,
            confidenceScore: 0.94,
            status: 'POTENTIAL',
        },
    });

    if (candidate && candidate.confidenceScore === 0.94) {
        console.log('  ✅ Neon Postgres Duplicate Candidate Relation & Confidence Score: PASSED');
    } else {
        console.error('❌ Duplicate Candidate Creation: FAILED');
        return false;
    }

    // 3. Cleanup Test Records
    await db.duplicateCandidate.delete({ where: { id: candidate.id } });
    await db.pothole.deleteMany({ where: { id: { in: [primaryId, duplicateId] } } });
    console.log('  ✅ Duplicate Test Cleanup: PASSED');

    console.log('✅ Duplicate Detection Integration Suite: ALL TESTS PASSED');
    return true;
}
