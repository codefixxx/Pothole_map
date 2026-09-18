import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const userId = session.user.id;

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

    return Response.json({
        success: true,
        data: {
            stats: {
                reportsFiled,
                resolvedIssues,
                upvotesGiven,
                followedCount,
                communityConfirmations,
            },
            myReports: formattedMyReports,
            upvotedPotholes: formattedUpvoted,
            followedReports: formattedFollowed,
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image || null,
                role: session.user.role,
                createdAt: session.user.createdAt,
            },
        },
    });
});
