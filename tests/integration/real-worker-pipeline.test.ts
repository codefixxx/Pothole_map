import { db } from '../../src/lib/db';
import { getOrCreateTestUser } from '../helpers/test-user';
import { enqueuePotholeProcessing, getPotholeQueue } from '../../src/lib/queue';
import { potholeWorker } from '../../src/workers/pothole.worker';
import { ImageProcessingState } from '@prisma/client';

export async function runRealWorkerPipelineIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Real BullMQ Worker & PostGIS Async Pipeline (Zero Mocks) ---');

    const actor = await getOrCreateTestUser();
    const testPotholeId = `worker-int-pothole-${Date.now()}`;
    const testImageKey = `storage-key-${Date.now()}`;

    try {
        // 1. Create Pothole with ReportImage record
        const pothole = await db.pothole.create({
            data: {
                id: testPotholeId,
                userId: actor.id,
                title: 'BullMQ Async Processing Pothole Test',
                description: 'Verifying live worker optimization and embedding pipeline',
                latitude: 28.6139,
                longitude: 77.2090,
                city: 'New Delhi',
                status: 'PENDING',
                severity: 5,
                reportImage: {
                    create: {
                        storageKey: testImageKey,
                        processingState: ImageProcessingState.PENDING,
                        metadata: { size: 1024000 },
                    },
                },
            },
            include: { reportImage: true },
        });

        if (pothole && pothole.reportImage) {
            console.log('  ✅ Test Pothole & Pending ReportImage Record Creation: PASSED');
        } else {
            console.error('❌ Record Creation: FAILED');
            return false;
        }

        // 2. Enqueue real BullMQ job into Redis queue
        await enqueuePotholeProcessing(pothole.id, testImageKey);
        console.log('  ✅ Enqueued Job in Real Redis BullMQ Queue: PASSED');

        // 3. Poll DB until background worker processes job (timeout 12s)
        const pollStart = Date.now();
        let processedImage = null;

        while (Date.now() - pollStart < 12000) {
            await new Promise((r) => setTimeout(r, 500));
            processedImage = await db.reportImage.findUnique({
                where: { storageKey: testImageKey },
            });
            if (processedImage?.processingState === ImageProcessingState.COMPLETED) {
                break;
            }
        }

        if (processedImage?.processingState === ImageProcessingState.COMPLETED) {
            console.log('  ✅ Live Worker Processing State Transition (PENDING -> COMPLETED): PASSED');
        } else {
            console.error('❌ Worker Async Processing: FAILED or TIMED OUT', processedImage);
            return false;
        }

        // 4. Assert Metadata Optimization
        const meta = processedImage.metadata as any;
        if (meta && meta.optimizationStatus === 'success' && meta.format === 'webp') {
            console.log('  ✅ Image Metadata Optimization & Compression: PASSED');
        } else {
            console.error('❌ Metadata Optimization Assertion: FAILED', meta);
            return false;
        }

        // 5. Clean up test records
        await db.reportImage.delete({ where: { storageKey: testImageKey } });
        await db.pothole.delete({ where: { id: testPotholeId } });
        console.log('  ✅ Worker Test Record Cleanup: PASSED');

    } catch (err) {
        console.error('❌ Real Worker Pipeline Test Error:', err);
        return false;
    } finally {
        // Close worker listener cleanly
        await potholeWorker.close().catch(() => {});
        await getPotholeQueue().close().catch(() => {});
    }

    console.log('✅ Real Worker Pipeline Suite: ALL TESTS PASSED CLEANLY');
    return true;
}
