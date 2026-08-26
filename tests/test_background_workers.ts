import 'dotenv/config';
import { db } from '../src/lib/db';
import { createPothole } from '../src/services/pothole.service';
import { getPotholeQueue } from '../src/lib/queue';
import { ImageProcessingState, LocationSource } from '@prisma/client';
import { getRedisConnection } from '../src/lib/redis';
import * as jurisdictionRepo from '../src/repositories/jurisdiction.repository';
import { createMunicipality } from '../src/services/municipality.service';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log('=== STARTING BACKGROUND WORKER INTEGRATION TESTS ===\n');

    const testEmail = 'worker.test@pothole.in';
    const imageKey = 'mock-test-key-999';
    const munName = 'Worker Test City';

    // 1. Cleanup
    console.log('Step 1: Cleaning up existing test records...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: testEmail } } },
                { duplicate: { user: { email: testEmail } } }
            ]
        }
    });
    await db.pothole.deleteMany({
        where: { user: { email: testEmail } },
    });
    await db.reportImage.deleteMany({
        where: { storageKey: imageKey },
    });
    
    // Clean up jurisdiction and municipality
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
        include: { jurisdiction: true },
    });
    if (oldMun) {
        if (oldMun.jurisdiction) {
            await db.jurisdiction.delete({ where: { id: oldMun.jurisdiction.id } });
        }
        await db.municipality.delete({ where: { id: oldMun.id } });
    }

    await db.user.deleteMany({
        where: { email: testEmail },
    });
    console.log('Cleanup completed.\n');

    // 2. Create user, municipality, and jurisdiction boundary
    console.log('Step 2: Creating mock verified citizen, municipality, and jurisdiction...');
    const user = await db.user.create({
        data: {
            name: 'Worker Citizen',
            email: testEmail,
            emailVerified: true,
        },
    });
    console.log(`- User created: ${user.id}`);

    const municipality = await createMunicipality({ name: munName });
    console.log(`- Municipality created: ${municipality.id}`);

    // Simple boundary containing Bangalore-ish coordinates: longitude 77.5946, latitude 12.9716
    // Note: PostGIS polygon coordinates are generally specified as [longitude, latitude]
    const boundary = [
        [
            [77.0, 12.0],
            [78.0, 12.0],
            [78.0, 13.0],
            [77.0, 13.0],
            [77.0, 12.0],
        ]
    ];
    const jurisdiction = await jurisdictionRepo.create({
        name: `${munName} Jurisdiction`,
        boundary,
        municipalityId: municipality.id,
    });
    if (!jurisdiction) {
        throw new Error('FAILED: Mock jurisdiction was not created.');
    }
    console.log(`- Jurisdiction boundary created: ${jurisdiction.id}\n`);

    // 3. Create First Pothole (Center)
    console.log('Step 3: Creating first pothole with image (will auto-route to municipality)...');
    const pothole1 = await createPothole({
        title: 'Background Pothole 1',
        description: 'First test pothole for background workers.',
        latitude: 12.9716,
        longitude: 77.5946,
        userId: user.id,
        severity: 3,
        locationSource: LocationSource.GPS,
        image: {
            storageKey: imageKey,
            metadata: {
                name: 'pothole_original.jpg',
                size: 600000,
                url: `https://utfs.io/f/${imageKey}`,
            },
        },
    });
    console.log(`First pothole created (ID: ${pothole1.id}, routed to Municipality: ${pothole1.municipalityId}). Job enqueued.\n`);

    // 4. Create Second Pothole (10m away, duplicate)
    console.log('Step 4: Creating second pothole nearby (duplicate candidate)...');
    const pothole2 = await createPothole({
        title: 'Background Pothole 2',
        description: 'Second test pothole reported close to the first.',
        latitude: 12.97165, // very close
        longitude: 77.5946,
        userId: user.id,
        severity: 4,
        locationSource: LocationSource.GPS,
    });
    console.log(`Second pothole created (ID: ${pothole2.id}, routed to Municipality: ${pothole2.municipalityId}). Job enqueued.\n`);

    // 5. Start background worker dynamically now that creation is done
    console.log('Step 5: Starting background worker dynamically to process enqueued jobs...');
    const { potholeWorker } = await import('../src/workers/pothole.worker');
    
    console.log('Worker active. Waiting for all jobs in queue to complete...');
    const queue = getPotholeQueue();
    let active = await queue.getActiveCount();
    let waiting = await queue.getWaitingCount();
    let attempts = 0;
    while ((active > 0 || waiting > 0) && attempts < 30) {
        await delay(500);
        active = await queue.getActiveCount();
        waiting = await queue.getWaitingCount();
        attempts++;
    }
    console.log('All jobs processed. Proceeding to assertions.\n');

    // 6. Assertions
    console.log('Step 6: Verifying image optimization states in DB...');
    const updatedImage = await db.reportImage.findUnique({
        where: { storageKey: imageKey },
    });

    if (!updatedImage) {
        throw new Error('FAILED: ReportImage was not created or found.');
    }
    console.log(`- Image Processing State: ${updatedImage.processingState} (Expected: COMPLETED)`);
    if (updatedImage.processingState !== ImageProcessingState.COMPLETED) {
        throw new Error('FAILED: Image processing state is not COMPLETED.');
    }

    const meta = updatedImage.metadata as any;
    console.log(`- Image Format: ${meta.format} (Expected: webp)`);
    console.log(`- Image Optimized Size: ${meta.optimizedSize} bytes (Expected: ~240000)`);
    if (meta.format !== 'webp' || !meta.optimizedSize) {
        throw new Error('FAILED: Image metadata was not populated correctly.');
    }
    console.log('  [OK] Image optimization verification passed.\n');

    console.log('Verifying duplicate candidate linking in DB...');
    const duplicateCandidates = await db.duplicateCandidate.findMany({
        where: { potholeId: pothole2.id },
    });

    console.log(`- Found ${duplicateCandidates.length} duplicate candidates linked to Pothole 2.`);
    if (duplicateCandidates.length === 0) {
        throw new Error('FAILED: No duplicate candidates were linked to Pothole 2.');
    }

    const linkedToPothole1 = duplicateCandidates.some(c => c.duplicateId === pothole1.id);
    if (!linkedToPothole1) {
        throw new Error('FAILED: Pothole 1 was not linked as a duplicate candidate for Pothole 2.');
    }
    console.log('  [OK] Duplicate candidate verification passed.\n');

    // 7. Cleanup test data
    console.log('Step 7: Cleaning up mock test records from DB...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: testEmail } } },
                { duplicate: { user: { email: testEmail } } }
            ]
        }
    });
    await db.pothole.deleteMany({
        where: { user: { email: testEmail } },
    });
    await db.reportImage.deleteMany({
        where: { storageKey: imageKey },
    });
    
    // Clean up jurisdiction and municipality
    const cleanupMun = await db.municipality.findUnique({
        where: { name: munName },
        include: { jurisdiction: true },
    });
    if (cleanupMun) {
        if (cleanupMun.jurisdiction) {
            await db.jurisdiction.delete({ where: { id: cleanupMun.jurisdiction.id } });
        }
        await db.municipality.delete({ where: { id: cleanupMun.id } });
    }

    await db.user.deleteMany({
        where: { email: testEmail },
    });
    console.log('DB Cleanup completed.\n');

    console.log('=== ALL BACKGROUND WORKER INTEGRATION TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        // Shutdown BullMQ connections so node process exits
        console.log('Shutting down queue connections...');
        try {
            const queue = getPotholeQueue();
            await queue.close();
        } catch (e) {
            console.error('Failed to close queue:', e);
        }
        
        try {
            // Import dynamically in case it wasn't resolved
            const { potholeWorker } = await import('../src/workers/pothole.worker');
            await potholeWorker.close();
        } catch (e) {
            console.error('Failed to close worker:', e);
        }

        try {
            const redis = getRedisConnection();
            await redis.quit();
        } catch (e) {
            console.error('Failed to quit redis:', e);
        }

        await db.$disconnect();
        console.log('Connections closed. Exiting.');
    });
