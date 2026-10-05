import { getRedisConnection } from './redis';

// Memory cache fallback when Redis is unavailable
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

/**
 * Retrieves a cached value or executes the fetcher function and caches the result.
 */
export async function getCachedOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<T> {
    // 1. Try Redis cache
    try {
        const redis = getRedisConnection();
        if (redis && redis.status === 'ready') {
            const cached = await redis.get(key);
            if (cached) {
                return JSON.parse(cached) as T;
            }
        }
    } catch {
        // Fall through
    }

    // 2. Try Memory cache fallback
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
        return entry.value as T;
    }

    // 3. Cache miss: execute database fetcher
    const freshData = await fetcher();

    // 4. Update cache
    try {
        const redis = getRedisConnection();
        if (redis && redis.status === 'ready') {
            await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
            return freshData;
        }
    } catch {
        // Fall through to memory store
    }

    memoryCache.set(key, {
        value: freshData,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return freshData;
}

/**
 * Invalidates cache by explicit key or pattern array.
 */
export async function invalidateCacheKeys(keys: string[]) {
    for (const key of keys) {
        memoryCache.delete(key);
    }

    try {
        const redis = getRedisConnection();
        if (redis && redis.status === 'ready') {
            for (const key of keys) {
                if (key.includes('*')) {
                    const matchingKeys = await redis.keys(key);
                    if (matchingKeys.length > 0) {
                        await redis.del(...matchingKeys);
                    }
                } else {
                    await redis.del(key);
                }
            }
        }
    } catch {
        // Silent catch for Redis fallback
    }
}

