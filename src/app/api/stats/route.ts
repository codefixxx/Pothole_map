import { NextResponse } from 'next/server';
import { getHomepageStats } from '@/src/services/stats.service';

export async function GET() {
    try {
        const stats = await getHomepageStats();
        return NextResponse.json({
            success: true,
            data: stats,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch homepage statistics' },
            { status: 500 }
        );
    }
}
