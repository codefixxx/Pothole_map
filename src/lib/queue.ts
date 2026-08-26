import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

declare global {
    var potholeQueue: Queue | undefined;
}

export const POTHOLE_QUEUE_NAME = 'pothole-tasks';

export const getPotholeQueue = (): Queue => {
    if (global.potholeQueue) {
        return global.potholeQueue;
    }
    const connection = getRedisConnection();
    const queue = new Queue(POTHOLE_QUEUE_NAME, { connection });
    if (process.env.NODE_ENV !== 'production') {
        global.potholeQueue = queue;
    }
    return queue;
};

export async function enqueuePotholeProcessing(potholeId: string, imageKey?: string) {
    const queue = getPotholeQueue();
    await queue.add(
        'process-pothole',
        { potholeId, imageKey },
        {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );
}
