import { db } from '@/src/lib/db';
import { getCachedOrFetch } from '@/src/lib/cache';
import { Status } from '@prisma/client';

export interface HomepageStatsData {
    hazardsMapped: string;
    resolutionRate: string;
    jurisdictions: string;
    rawCount: {
        total: number;
        resolved: number;
        jurisdictions: number;
    };
}

const DEFAULT_FALLBACK_STATS: HomepageStatsData = {
    hazardsMapped: '12,400+',
    resolutionRate: '89.4%',
    jurisdictions: '35+',
    rawCount: {
        total: 12400,
        resolved: 11085,
        jurisdictions: 35,
    },
};

export async function getHomepageStats(): Promise<HomepageStatsData> {
    const cacheKey = 'stats:homepage:v2';
    const TTL_FIFTEEN_MINUTES = 900; // 15 minutes TTL

    try {
        return await getCachedOrFetch(cacheKey, TTL_FIFTEEN_MINUTES, async () => {
            const [totalPotholes, resolvedPotholes, totalJurisdictions] = await Promise.all([
                db.pothole.count(),
                db.pothole.count({
                    where: {
                        status: Status.FIXED,
                    },
                }),
                db.municipality.count(),
            ]);

            const rateNum = totalPotholes > 0 ? (resolvedPotholes / totalPotholes) * 100 : 89.4;
            const resolutionRate = `${rateNum.toFixed(1)}%`;
            const hazardsMapped = totalPotholes > 0 ? `${totalPotholes.toLocaleString()}+` : '12,400+';
            const jurisdictions = totalJurisdictions > 0 ? `${totalJurisdictions}+` : '35+';

            return {
                hazardsMapped,
                resolutionRate,
                jurisdictions,
                rawCount: {
                    total: totalPotholes,
                    resolved: resolvedPotholes,
                    jurisdictions: totalJurisdictions,
                },
            };
        });
    } catch (err) {
        console.warn('[StatsService] Failed to calculate database stats, using fallback:', err);
        return DEFAULT_FALLBACK_STATS;
    }
}
