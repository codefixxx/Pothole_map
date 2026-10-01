import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

declare global {
    var potholeQueue: Queue | undefined;
    var potholeDLQ: Queue | undefined;
}

export const POTHOLE_QUEUE_NAME = 'pothole-tasks';
export const POTHOLE_DLQ_NAME = 'pothole-tasks-dlq';

export const getPotholeQueue = (): Queue => {
    if (global.potholeQueue) {
        return global.potholeQueue;
    }
    const connection = getRedisConnection();
    const queue = new Queue(POTHOLE_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: { count: 500, age: 86400 },
            removeOnFail: false,
        },
    });
    if (process.env.NODE_ENV !== 'production') {
        global.potholeQueue = queue;
    }
    return queue;
};

export const getPotholeDLQ = (): Queue => {
    if (global.potholeDLQ) {
        return global.potholeDLQ;
    }
    const connection = getRedisConnection();
    const dlq = new Queue(POTHOLE_DLQ_NAME, { connection });
    if (process.env.NODE_ENV !== 'production') {
        global.potholeDLQ = dlq;
    }
    return dlq;
};

export async function enqueuePotholeProcessing(potholeId: string, imageKey?: string) {
    const queue = getPotholeQueue();
    await queue.add(
        'process-pothole',
        { potholeId, imageKey, createdAt: new Date().toISOString() },
        {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: { count: 500, age: 86400 },
            removeOnFail: false,
        }
    );
}

export async function sendToDeadLetterQueue(
    jobData: Record<string, any>,
    errorReason: string,
    originalJobId?: string
) {
    const dlq = getPotholeDLQ();
    await dlq.add('dead-letter-job', {
        originalJobId,
        jobData,
        errorReason,
        failedAt: new Date().toISOString(),
    });
    console.warn(`[DLQ] Job ${originalJobId || 'unknown'} moved to Dead Letter Queue: ${errorReason}`);
}

