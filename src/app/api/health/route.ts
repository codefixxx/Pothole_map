import { db } from '@/src/lib/db';
import { getRedisConnection } from '@/src/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    // Check Database connectivity
    try {
        await db.$queryRaw`SELECT 1`;
    } catch (err) {
        console.error('Health check DB error:', err);
        dbStatus = 'degraded';
    }

    // Check Redis connectivity
    try {
        const redis = getRedisConnection();
        redisStatus = redis.status === 'ready' ? 'ready' : 'fallback_memory';
    } catch {
        redisStatus = 'fallback_memory';
    }

    const isHealthy = dbStatus === 'healthy';

    return NextResponse.json(
        {
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
            services: {
                database: dbStatus,
                cache: redisStatus,
            },
            version: '2.0.0',
        },
        { status: isHealthy ? 200 : 503 }
    );
}
