import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { followPothole, unfollowPothole, isFollowingPothole } from '@/src/services/social.service';

export const POST = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    const follow = await followPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: follow,
    });
});

export const DELETE = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    await unfollowPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        message: 'Successfully unfollowed report.',
    });
});

export const GET = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    const following = await isFollowingPothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: {
            following,
        },
    });
});
