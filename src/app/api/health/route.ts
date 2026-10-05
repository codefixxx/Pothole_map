import { db } from '@/src/lib/db';
import { getRedisConnection } from '@/src/lib/redis';
import { getPotholeQueue } from '@/src/lib/queue';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
    try {
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        // 1. Database & PostGIS Health Check
        let dbStatus: 'up' | 'down' = 'down';
        let dbLatencyMs = 0;
        let postgisVersion: string | null = null;

        const dbStart = Date.now();
        try {
            const result = await db.$queryRaw<Array<{ postgis: string }>>`
                SELECT PostGIS_Full_Version() AS postgis;
            `;
            dbLatencyMs = Date.now() - dbStart;
            dbStatus = 'up';
            postgisVersion = result[0]?.postgis || 'Installed';
        } catch (err) {
            console.error('[HealthCheck] DB PostGIS Ping Error:', err);
            dbStatus = 'down';
            overallStatus = 'unhealthy';
        }

        // 2. Redis & BullMQ Queue Health Check
        let redisStatus: 'up' | 'degraded' | 'down' = 'down';
        let redisLatencyMs = 0;
        let queueJobCount = 0;

        const redisStart = Date.now();
        try {
            const redis = getRedisConnection();
            const pingRes = await redis.ping();
            redisLatencyMs = Date.now() - redisStart;
            if (pingRes === 'PONG') {
                redisStatus = 'up';
                const queue = getPotholeQueue();
                const counts = await queue.getJobCounts();
                queueJobCount = (counts.waiting || 0) + (counts.active || 0);
            } else {
                redisStatus = 'degraded';
            }
        } catch (err) {
            console.warn('[HealthCheck] Redis Queue Error:', err);
            redisStatus = 'degraded';
            if (overallStatus !== 'unhealthy') {
                overallStatus = 'degraded';
            }
        }

        // 3. Storage Provider Check
        let storageStatus: 'configured' | 'unconfigured' = 'unconfigured';
        if (process.env.UPLOADTHING_SECRET || process.env.UPLOADTHING_APP_ID) {
            storageStatus = 'configured';
        }

        const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

        return NextResponse.json(
            {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                uptimeSeconds,
                environment: process.env.NODE_ENV || 'development',
                services: {
                    database: {
                        status: dbStatus,
                        latencyMs: dbLatencyMs,
                        postgisVersion,
                    },
                    redisQueue: {
                        status: redisStatus,
                        latencyMs: redisLatencyMs,
                        pendingJobs: queueJobCount,
                    },
                    storage: {
                        status: storageStatus,
                        provider: 'uploadthing',
                    },
                },
                version: '2.0.0',
            },
            { status: httpStatus }
        );
    } catch (topErr: any) {
        return NextResponse.json(
            {
                status: 'error',
                message: topErr?.message || String(topErr),
                stack: topErr?.stack,
            },
            { status: 500 }
        );
    }
}

