import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { votePothole, unvotePothole } from '@/src/services/social.service';

export const POST = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    const vote = await votePothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        data: vote,
    });
});

export const DELETE = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    await unvotePothole(session.user.id, potholeId);

    return Response.json({
        success: true,
        message: 'Vote/confirmation removed successfully.',
    });
});
