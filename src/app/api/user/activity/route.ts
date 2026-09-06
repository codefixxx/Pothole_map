import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const url = new URL(req.url);
    const demoMode = url.searchParams.get('demo') === 'true';

    if (!session && !demoMode) {
        throw new AppError('Unauthorized', 401);
    }

    const userId = session?.user?.id || 'demo-user-id';

    // 1. Fetch user's reported potholes
    const myReports = await db.pothole.findMany({
        where: { userId },
        include: {
            municipality: { select: { id: true, name: true } },
            _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch potholes the user upvoted
    const userVotes = await db.vote.findMany({
        where: { userId },
        include: {
            pothole: {
                include: {
                    municipality: { select: { id: true, name: true } },
                    _count: { select: { votes: true, comments: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch potholes the user follows
    const userFollows = await db.reportFollower.findMany({
        where: { userId },
        include: {
            pothole: {
                include: {
                    municipality: { select: { id: true, name: true } },
                    _count: { select: { votes: true, comments: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Calculate aggregated impact stats
    const reportsFiled = myReports.length;
    const resolvedIssues = myReports.filter(
        (p) => p.status === 'FIXED'
    ).length;
    const upvotesGiven = userVotes.length;
    const followedCount = userFollows.length;
    const communityConfirmations = myReports.reduce(
        (sum, p) => sum + (p._count?.votes || 0),
        0
    );

    // Format pothole card representation
    const formatPothole = (p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        latitude: p.latitude,
        longitude: p.longitude,
        city: p.city,
        state: p.state,
        status: p.status,
        severity: p.severity,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        municipality: p.municipality,
        votesCount: p._count?.votes || 0,
        commentsCount: p._count?.comments || 0,
    });

    const formattedMyReports = myReports.map(formatPothole);
    const formattedUpvoted = userVotes
        .filter((v) => v.pothole)
        .map((v) => formatPothole(v.pothole));
    const formattedFollowed = userFollows
        .filter((f) => f.pothole)
        .map((f) => formatPothole(f.pothole));

    // If demo mode or if user has no data yet and demo mode is requested
    const sampleData = demoMode || (formattedMyReports.length === 0 && formattedUpvoted.length === 0 && formattedFollowed.length === 0) ? {
        demoReports: [
            {
                id: 'sample-1',
                title: 'Deep crater on Rajpath Outer Junction',
                description: 'Large 40cm pothole on the outer commuter lane causing severe traffic slowdown and hazard for two-wheelers.',
                latitude: 28.6139,
                longitude: 77.209,
                city: 'New Delhi',
                state: 'Delhi',
                status: 'PENDING',
                severity: 8,
                imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
                createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                municipality: { id: 'mun-1', name: 'New Delhi Municipal Council (NDMC)' },
                votesCount: 20,
                commentsCount: 2,
            },
            {
                id: 'sample-4',
                title: 'Resurfaced trench on Outer Ring Road',
                description: 'Complete asphalt patch finished with seal coat inspection signed off.',
                latitude: 28.545,
                longitude: 77.27,
                city: 'South Delhi',
                state: 'Delhi',
                status: 'FIXED',
                severity: 3,
                imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
                createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                municipality: { id: 'mun-2', name: 'Municipal Corporation of Delhi (MCD)' },
                votesCount: 31,
                commentsCount: 5,
            }
        ],
        demoUpvoted: [
            {
                id: 'sample-2',
                title: 'Multiple potholes near Hauz Khas Metro Gate 2',
                description: 'Cluster of 3 sharp edge potholes in rapid succession right next to the bus stop bay.',
                latitude: 28.5494,
                longitude: 77.2001,
                city: 'South Delhi',
                state: 'Delhi',
                status: 'VERIFIED',
                severity: 6,
                imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
                createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
                municipality: { id: 'mun-2', name: 'Municipal Corporation of Delhi (MCD)' },
                votesCount: 42,
                commentsCount: 7,
            }
        ],
        demoFollowed: [
            {
                id: 'sample-3',
                title: 'Widened road fissure under Barapullah Flyover',
                description: 'Continuous crack spanning 2 lanes after monsoons, deep edges visible.',
                latitude: 28.5833,
                longitude: 77.2333,
                city: 'New Delhi',
                state: 'Delhi',
                status: 'ONGOING',
                severity: 9,
                imageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=80',
                createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
                municipality: { id: 'mun-1', name: 'New Delhi Municipal Council (NDMC)' },
                votesCount: 58,
                commentsCount: 12,
            }
        ]
    } : null;

    return Response.json({
        success: true,
        data: {
            stats: {
                reportsFiled: formattedMyReports.length || (sampleData ? sampleData.demoReports.length : 0),
                resolvedIssues: resolvedIssues || (sampleData ? 1 : 0),
                upvotesGiven: upvotesGiven || (sampleData ? sampleData.demoUpvoted.length : 0),
                followedCount: followedCount || (sampleData ? sampleData.demoFollowed.length : 0),
                communityConfirmations: communityConfirmations || (sampleData ? 51 : 0),
            },
            myReports: formattedMyReports.length > 0 ? formattedMyReports : (sampleData?.demoReports || []),
            upvotedPotholes: formattedUpvoted.length > 0 ? formattedUpvoted : (sampleData?.demoUpvoted || []),
            followedReports: formattedFollowed.length > 0 ? formattedFollowed : (sampleData?.demoFollowed || []),
            isDemoData: formattedMyReports.length === 0 && formattedUpvoted.length === 0 && formattedFollowed.length === 0 && !!sampleData,
            user: {
                id: session?.user?.id || 'demo-citizen-1',
                name: session?.user?.name || 'Aarav Sharma',
                email: session?.user?.email || 'aarav.sharma@example.com',
                image: session?.user?.image || null,
                role: session?.user?.role || 'USER',
                createdAt: session?.user?.createdAt || new Date().toISOString(),
            },
        },
    });
});
