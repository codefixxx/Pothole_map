import Redis, { RedisOptions } from 'ioredis';

// BullMQ connection requires maxRetriesPerRequest to be null
export const redisConnectionOptions: RedisOptions = {
    maxRetriesPerRequest: null,
};

declare global {
    var redisConnection: Redis | undefined;
}

export function cleanRedisUrl(url: string | undefined): string {
    if (!url) return 'redis://127.0.0.1:6379';
    let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
    
    // Extract all redis:// or rediss:// occurrences
    const matches = cleaned.match(/(rediss?:\/\/[^\s'"]+)/gi);
    if (matches && matches.length > 0) {
        // Find the actual connection string containing credentials (@) or domain (.io, :6379)
        const validMatch = matches.reverse().find((m) => m.includes('@') || m.includes('.io') || m.includes(':6379'));
        cleaned = validMatch || matches[0];
    }

    if (cleaned.includes('redis-cli')) {
        return 'redis://127.0.0.1:6379';
    }

    try {
        new URL(cleaned);
        return cleaned;
    } catch {
        console.warn('[Redis] Invalid REDIS_URL format provided, falling back to 127.0.0.1');
        return 'redis://127.0.0.1:6379';
    }
}

export const getRedisConnection = () => {
    if (global.redisConnection) {
        return global.redisConnection;
    }

    const redisUrl = cleanRedisUrl(process.env.REDIS_URL);
    const isTls = redisUrl.startsWith('rediss://');
    const options: RedisOptions = {
        ...redisConnectionOptions,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        keepAlive: 10000,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        retryStrategy(times) {
            if (times > 3 && process.env.NODE_ENV === 'production') {
                return null;
            }
            const delay = Math.min(times * 200, 2000);
            return delay;
        },
    };

    let conn: Redis;
    try {
        conn = new Redis(redisUrl, options);
    } catch (err) {
        console.warn('[Redis] Failed to instantiate ioredis with URL, falling back:', err);
        conn = new Redis('redis://127.0.0.1:6379', options);
    }

    conn.on('error', (err) => {
        if (err.message && (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT') || err.message.includes('NR_CLOSED'))) {
            return;
        }
        console.warn('[Redis] Connection warning:', err.message);
    });

    if (process.env.NODE_ENV !== 'production') {
        global.redisConnection = conn;
    }
    return conn;
};

