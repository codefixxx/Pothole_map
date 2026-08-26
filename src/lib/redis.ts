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
    const conn = new Redis(redisUrl, redisConnectionOptions);
    if (process.env.NODE_ENV !== 'production') {
        global.redisConnection = conn;
    }
    return conn;
};
