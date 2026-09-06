import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { followPothole, unfollowPothole, isFollowingPothole } from '@/src/services/social.service';

export const POST = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: {
                id: `mock-follow-${Date.now()}`,
                userId: session.user.id,
                potholeId,
            },
        });
    }

    const follow = await followPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: follow,
    });
});

export const DELETE = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            message: 'Successfully unfollowed report.',
        });
    }

    await unfollowPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        message: 'Successfully unfollowed report.',
    });
});

export const GET = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return Response.json({
            success: true,
            data: {
                following: false,
            },
        });
    }

    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: {
                following: false,
            },
        });
    }

    const following = await isFollowingPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: {
            following,
        },
    });
});
