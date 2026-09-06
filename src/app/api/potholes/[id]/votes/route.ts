import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';
import { votePothole, unvotePothole } from '@/src/services/social.service';

export const GET = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;
    const session = await auth.api.getSession({ headers: await headers() });

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: {
                hasVoted: false,
                count: 19,
            },
        });
    }

    const voteCount = await db.vote.count({
        where: { potholeId },
    });

    let hasVoted = false;
    if (session?.user?.id) {
        const existingVote = await db.vote.findUnique({
            where: {
                potholeId_userId: {
                    potholeId,
                    userId: session.user.id,
                },
            },
        });
        hasVoted = !!existingVote;
    }

    return Response.json({
        success: true,
        data: {
            hasVoted,
            count: voteCount,
        },
    });
});

export const POST = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: {
                id: `mock-vote-${Date.now()}`,
                userId: session.user.id,
                potholeId,
            },
        });
    }

    const vote = await votePothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: vote,
    });
});

export const DELETE = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            message: 'Vote/confirmation removed successfully.',
        });
    }

    await unvotePothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        message: 'Vote/confirmation removed successfully.',
    });
});
