import { Worker } from 'bullmq';
import { db } from '../lib/db';
import { getRedisConnection } from '../lib/redis';
import { POTHOLE_QUEUE_NAME, sendToDeadLetterQueue } from '../lib/queue';
import { linkDuplicateCandidates } from '../services/duplicate.service';
import { generateImageEmbedding } from '../services/embedding.service';
import { notifyCityAdmin, notifyNearbyDrivers, notifyNewPotholeReport } from '../services/notification.service';
import { ImageProcessingState } from '../types/enums';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const potholeWorker = new Worker(
    POTHOLE_QUEUE_NAME,
    async (job) => {
        const { potholeId, imageKey } = job.data;
        console.log(`[Worker] Started processing job ${job.id} (Attempt ${job.attemptsMade + 1}) for pothole: ${potholeId}`);

        // 1. Fetch pothole details
        const pothole = await db.pothole.findUnique({
            where: { id: potholeId },
            include: { reportImage: true },
        });

        if (!pothole) {
            console.warn(`[Worker] Pothole with ID ${potholeId} not found. Skipping.`);
            return;
        }

        // 2. Asynchronous Image Optimization
        const image = pothole.reportImage || (imageKey ? await db.reportImage.findUnique({ where: { storageKey: imageKey } }) : null);
        if (image) {
            console.log(`[Worker] Optimizing image: ${image.storageKey}`);
            await db.reportImage.update({
                where: { id: image.id },
                data: { processingState: ImageProcessingState.PROCESSING },
            });

            try {
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

                // Generate and save AI visual embedding
                console.log(`[Worker] Generating AI embedding for image: ${image.storageKey}`);
                const embedding = await generateImageEmbedding(image.storageKey);
                const embeddingStr = `[${embedding.join(',')}]`;
                await db.$executeRawUnsafe(
                    `UPDATE "report_image" SET "embedding" = '${embeddingStr}'::vector WHERE "id" = '${image.id}'`
                );
                console.log(`[Worker] Successfully stored AI embedding for image: ${image.storageKey}`);
            } catch (imageErr) {
                console.error(`[Worker] Image processing/embedding failed for ${image.storageKey}:`, imageErr);
                await db.reportImage.update({
                    where: { id: image.id },
                    data: { processingState: ImageProcessingState.FAILED },
                }).catch(() => {});
                throw imageErr; // Re-throw to trigger BullMQ exponential retry
            }
        } else {
            console.log(`[Worker] No image associated with pothole ${potholeId}. Skipping image optimization.`);
        }

        // 3. Proximity Duplicate Detection
        console.log(`[Worker] Running duplicate check for pothole ${potholeId}`);
        const duplicateCandidates = await linkDuplicateCandidates(potholeId, 100, 0.1);
        console.log(`[Worker] Duplicate check completed. Linked ${duplicateCandidates.length} potential duplicates.`);

        // 4. Notification Triggers
        console.log(`[Worker] Triggering notifications for pothole ${potholeId}`);
        await notifyNewPotholeReport(pothole.municipalityId, pothole.id, pothole.title);
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

potholeWorker.on('failed', async (job, err) => {
    const attempts = job?.opts?.attempts || 5;
    console.error(`[Worker] Job ${job?.id} failed on attempt ${job?.attemptsMade}/${attempts}:`, err.message);

    if (job && job.attemptsMade >= attempts) {
        console.warn(`[Worker] Job ${job.id} has exhausted all ${attempts} attempts. Routing to Dead Letter Queue (DLQ)...`);
        await sendToDeadLetterQueue(job.data, err.message, job.id).catch((dlqErr) => {
            console.error('[Worker] Failed to push job to Dead Letter Queue:', dlqErr);
        });
    }
});

console.log('[Worker] Pothole worker is running with retry backoff & DLQ protection...');

