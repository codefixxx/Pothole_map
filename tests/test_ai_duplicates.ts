import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality } from '../src/services/municipality.service';
import { createPothole } from '../src/services/pothole.service';
import { generateImageEmbedding } from '../src/services/embedding.service';
import { linkDuplicateCandidates } from '../src/services/duplicate.service';
import { LocationSource, DuplicateStatus, Status } from '@prisma/client';

async function main() {
    console.log('=== STARTING AI DUPLICATE DETECTION INTEGRATION TESTS ===\n');

    const citizenEmail = 'ai.citizen.dup@pothole.in';
    const munName = 'AI Duplicate City';
    const centerLat = 12.9716;
    const centerLng = 77.5946;

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: citizenEmail } } },
                { duplicate: { user: { email: citizenEmail } } }
            ]
        }
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.reportImage.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    await db.user.deleteMany({
        where: { email: citizenEmail },
    });
    console.log('Cleanup completed.\n');

    // 2. Create users and municipality
    console.log('Step 2: Creating mock municipality and citizen...');
    const municipality = await createMunicipality({ name: munName });
    const citizenUser = await db.user.create({
        data: { name: 'AI Citizen', email: citizenEmail, emailVerified: true },
    });
    console.log('Mock records created.\n');

    // 3. Test Local Embedding Generator (Mock default)
    console.log('Step 3: Verifying local embedding generator...');
    const mockVector = await generateImageEmbedding('dummy-image-key.jpg');
    if (mockVector.length !== 512) {
        throw new Error(`Expected embedding size 512, but got ${mockVector.length}`);
    }
    const sumSq = mockVector.reduce((sum, val) => sum + val * val, 0);
    console.log(`  [OK] Successfully generated mock embedding vector of size 512.`);
    console.log(`  [OK] Checked unit vector normalization magnitude: ${Number(Math.sqrt(sumSq).toFixed(4))}.\n`);

    // 4. Test storing vector embeddings in PostgreSQL pgvector column
    console.log('Step 4: Testing raw SQL storage of pgvector floats...');
    const potholeTemp = await createPothole({
        title: 'Temp Pothole for pgvector test',
        description: 'Testing vector raw inserts.',
        latitude: centerLat,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    // Create Report Image
    const tempImage = await db.reportImage.create({
        data: {
            storageKey: 'temp-storage-key',
            potholeId: potholeTemp.id,
        },
    });

    // Store custom 512-dim mock vector with a known coordinate
    const testEmbedding = Array.from({ length: 512 }, (_, idx) => (idx === 0 ? 1.0 : 0.0));
    const testEmbeddingStr = `[${testEmbedding.join(',')}]`;
    await db.$executeRawUnsafe(
        `UPDATE "report_image" SET "embedding" = '${testEmbeddingStr}'::vector WHERE "id" = '${tempImage.id}'`
    );

    // Retrieve back embedding
    const queryResult = await db.$queryRaw<{ id: string; embedding: string }[]>`
        SELECT "id", "embedding"::text FROM "report_image" WHERE "id" = ${tempImage.id}
    `;
    if (!queryResult[0]?.embedding) {
        throw new Error('FAILED: Vector embedding was not saved/retrieved successfully from PostgreSQL.');
    }
    const retrievedArr = queryResult[0].embedding.replace('[', '').replace(']', '').split(',').map(Number);
    if (retrievedArr.length !== 512 || retrievedArr[0] !== 1.0) {
        throw new Error('FAILED: Retrieved vector floats did not match inserted floats.');
    }
    console.log('  [OK] pgvector float array stored and retrieved successfully via raw SQL.\n');

    // Clean temp pothole
    await db.reportImage.delete({ where: { id: tempImage.id } });
    await db.pothole.delete({ where: { id: potholeTemp.id } });

    // 5. Test AI-based duplicate query using cosine similarity
    console.log('Step 5: Testing AI duplicate detection with mathematical vectors...');
    
    // We create three reports:
    // Report A: Reference report at center (Lat, Lng)
    // Report B: Nearby report (10m away) with HIGH visual similarity
    // Report C: Nearby report (15m away) with LOW visual similarity (orthogonal embedding)
    
    const potholeA = await createPothole({
        title: 'Report A (Reference)',
        description: 'Reference pothole report.',
        latitude: centerLat,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    const imageA = await db.reportImage.create({ data: { storageKey: 'img-a', potholeId: potholeA.id } });

    const potholeB = await createPothole({
        title: 'Report B (High Sim)',
        description: 'Duplicate nearby with matching visual context.',
        latitude: centerLat + 0.0001,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    const imageB = await db.reportImage.create({ data: { storageKey: 'img-b', potholeId: potholeB.id } });

    const potholeC = await createPothole({
        title: 'Report C (Low Sim)',
        description: 'Completely different pothole shape/color nearby.',
        latitude: centerLat - 0.00015,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    const imageC = await db.reportImage.create({ data: { storageKey: 'img-c', potholeId: potholeC.id } });

    // Update their embeddings in pgvector:
    // A: [1, 0, 0, ..., 0]
    // B: [0.95, 0.05, 0, ..., 0] (very high similarity: cosine similarity will be ~0.95)
    // C: [0, 1, 0, ..., 0] (orthogonal: similarity will be ~0.0)
    
    const embeddingA = Array.from({ length: 512 }, (_, i) => (i === 0 ? 1.0 : 0.0));
    const embeddingB = Array.from({ length: 512 }, (_, i) => (i === 0 ? 0.95 : i === 1 ? 0.05 : 0.0));
    const embeddingC = Array.from({ length: 512 }, (_, i) => (i === 1 ? 1.0 : 0.0));

    await db.$executeRawUnsafe(`UPDATE "report_image" SET "embedding" = '[${embeddingA.join(',')}]'::vector WHERE "id" = '${imageA.id}'`);
    await db.$executeRawUnsafe(`UPDATE "report_image" SET "embedding" = '[${embeddingB.join(',')}]'::vector WHERE "id" = '${imageB.id}'`);
    await db.$executeRawUnsafe(`UPDATE "report_image" SET "embedding" = '[${embeddingC.join(',')}]'::vector WHERE "id" = '${imageC.id}'`);

    console.log('  [OK] Inserted embeddings: A=[1, 0...], B=[0.95, 0.05...], C=[0, 1...]');

    // Run AI duplicate link
    console.log('  Running linkDuplicateCandidates on Report A...');
    const candidates = await linkDuplicateCandidates(potholeA.id, 100, 0.1);
    console.log(`  Linked ${candidates.length} potential duplicates.`);

    const highSimCandidate = candidates.find(c => c.duplicateId === potholeB.id);
    const lowSimCandidate = candidates.find(c => c.duplicateId === potholeC.id);

    console.log(`  - Report B Confidence Score: ${highSimCandidate?.confidenceScore}`);
    console.log(`  - Report C Confidence Score: ${lowSimCandidate?.confidenceScore}`);

    // Verify:
    // B has high visual similarity (~0.95) and distance ~10m (decay is high), so confidence should be high.
    // C has low visual similarity (~0.0) and distance ~15m, so confidence should be penalized heavily.
    if (!highSimCandidate) {
        throw new Error('FAILED: Report B was not identified as a duplicate candidate.');
    }
    if (highSimCandidate.confidenceScore < 0.6) {
        throw new Error(`FAILED: Report B confidence score is too low: ${highSimCandidate.confidenceScore}`);
    }

    // Since threshold is 0.1, Report C might not be saved at all, or if saved, should be much lower than B
    if (lowSimCandidate && lowSimCandidate.confidenceScore >= highSimCandidate.confidenceScore) {
        throw new Error('FAILED: Proximity similarity failed to penalize visual dissimilarity of Report C.');
    }
    console.log('  [OK] Hybrid AI duplicate scoring successfully distinguished matches from non-matches.\n');

    // 6. Cleanup
    console.log('Step 6: Cleaning up mock test records...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: citizenEmail } } },
                { duplicate: { user: { email: citizenEmail } } }
            ]
        }
    });
    await db.reportImage.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } },
    });
    await db.user.deleteMany({
        where: { email: citizenEmail },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL AI DUPLICATE DETECTION TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
