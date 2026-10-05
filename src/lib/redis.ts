import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// BullMQ connection requires maxRetriesPerRequest to be null
export const redisConnectionOptions: RedisOptions = {
    maxRetriesPerRequest: null,
};

declare global {
    var redisConnection: Redis | undefined;
}

export const getRedisConnection = () => {
    if (global.redisConnection) {
        return global.redisConnection;
    }

    const isTls = redisUrl.startsWith('rediss://');
    const options: RedisOptions = {
        ...redisConnectionOptions,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        keepAlive: 10000,
        enableOfflineQueue: true,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 2000);
            return delay;
        },
    };

    const conn = new Redis(redisUrl, options);
    conn.on('error', (err) => {
        // Silently handle expected connection reset errors from serverless Upstash Redis
        if (err.message && (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT'))) {
            return;
        }
        console.warn('[Redis] Connection warning:', err.message);
    });

    if (process.env.NODE_ENV !== 'production') {
        global.redisConnection = conn;
    }
    return conn;
};
