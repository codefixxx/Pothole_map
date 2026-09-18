import { getRedisConnection } from './redis';

const memoryRateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetInSeconds: number;
}

/**
 * Sliding window rate-limiter supporting Redis with in-memory Map fallback.
 * @param identifier IP address, user ID, or client key
 * @param limit Maximum number of requests allowed in window
 * @param windowSeconds Window duration in seconds
 */
export async function rateLimit(
    identifier: string,
    limit = 20,
    windowSeconds = 60
): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const redis = getRedisConnection();

    if (redis.status === 'ready') {
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }
            const ttl = await redis.ttl(key);

            return {
                success: current <= limit,
                limit,
                remaining: Math.max(0, limit - current),
                resetInSeconds: Math.max(0, ttl),
            };
        } catch {
            // Fall through to memory store fallback
        }
    }

    // In-memory fallback
    const entry = memoryRateLimitStore.get(key);
    if (!entry || entry.resetAt <= now) {
        memoryRateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowSeconds * 1000,
        });
        return {
            success: true,
            limit,
            remaining: limit - 1,
            resetInSeconds: windowSeconds,
        };
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

    return {
        success: entry.count <= limit,
        limit,
        remaining,
        resetInSeconds,
    };
}
