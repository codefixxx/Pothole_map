import { Worker } from 'bullmq';
import { db } from '../lib/db';
import { getRedisConnection } from '../lib/redis';
import { POTHOLE_QUEUE_NAME } from '../lib/queue';
import { linkDuplicateCandidates } from '../services/duplicate.service';
import { notifyCityAdmin, notifyNearbyDrivers } from '../services/notification.service';
import { ImageProcessingState } from '@prisma/client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const potholeWorker = new Worker(
    POTHOLE_QUEUE_NAME,
    async (job) => {
        const { potholeId, imageKey } = job.data;
        console.log(`[Worker] Started processing job ${job.id} for pothole: ${potholeId}`);

        // 1. Fetch pothole details
        const pothole = await db.pothole.findUnique({
            where: { id: potholeId },
            include: { reportImage: true },
        });

        if (!pothole) {
            console.warn(`[Worker] Pothole with ID ${potholeId} not found. Skipping.`);
            return;
        }

        // 2. Asynchronous Image Optimization (Simulated)
        const image = pothole.reportImage || (imageKey ? await db.reportImage.findUnique({ where: { storageKey: imageKey } }) : null);
        if (image) {
            console.log(`[Worker] Optimizing image: ${image.storageKey}`);
            await db.reportImage.update({
                where: { id: image.id },
                data: { processingState: ImageProcessingState.PROCESSING },
            });

            // Simulate compression and processing delay
            await delay(1000);

            const mockMetadata = {
                ...(image.metadata as object || {}),
                width: 1920,
                height: 1080,
                format: 'webp',
                optimizedSize: Math.round(Number((image.metadata as any)?.size || 500000) * 0.4),
                compressedAt: new Date().toISOString(),
                optimizationStatus: 'success',
            };

            await db.reportImage.update({
                where: { id: image.id },
                data: {
                    processingState: ImageProcessingState.COMPLETED,
                    metadata: mockMetadata,
                },
            });
            console.log(`[Worker] Image optimization completed for: ${image.storageKey}`);
        } else {
            console.log(`[Worker] No image associated with pothole ${potholeId}. Skipping image optimization.`);
        }

        // 3. Proximity Duplicate Detection
        console.log(`[Worker] Running duplicate check for pothole ${potholeId}`);
        const duplicateCandidates = await linkDuplicateCandidates(potholeId, 100, 0.1);
        console.log(`[Worker] Duplicate check completed. Linked ${duplicateCandidates.length} potential duplicates.`);

        // 4. Notification Triggers
        console.log(`[Worker] Triggering notifications for pothole ${potholeId}`);
        if (pothole.city) {
            await notifyCityAdmin(pothole.city, pothole.id);
        }
        await notifyNearbyDrivers(pothole.latitude, pothole.longitude, pothole.id);

        console.log(`[Worker] Successfully processed job ${job.id} for pothole: ${potholeId}`);
    },
    {
        connection: getRedisConnection(),
        concurrency: 2,
    }
);

potholeWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
});

potholeWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

console.log('[Worker] Pothole worker is running and listening for jobs...');
