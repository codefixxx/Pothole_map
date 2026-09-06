import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { addComment, getPotholeComments } from '@/src/services/social.service';
import { commentSchema } from '@/src/lib/validations/social.schema';

export const POST = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;
    const body = await req.json();

    const result = commentSchema.safeParse(body);
    if (!result.success) {
        throw new AppError(result.error.issues[0]?.message || 'Invalid comment data', 400);
    }

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: {
                id: `mock-comment-${Date.now()}`,
                potholeId,
                userId: session.user.id,
                content: result.data.content,
                createdAt: new Date().toISOString(),
                user: {
                    id: session.user.id,
                    name: session.user.name || 'Citizen',
                    image: session.user.image || null,
                },
            },
        });
    }

    const comment = await addComment(session.user.id, potholeId, result.data.content);

    return Response.json({
        success: true,
        data: comment,
    });
});

export const GET = asyncHandler(async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    const resolvedParams = await Promise.resolve(params);
    const potholeId = resolvedParams.id;

    if (potholeId.startsWith('sample-')) {
        return Response.json({
            success: true,
            data: [
                {
                    id: 'c-1',
                    potholeId,
                    userId: 'u-comm-1',
                    content: 'I almost lost control of my scooter here yesterday evening. Please fix ASAP!',
                    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                    user: {
                        id: 'u-comm-1',
                        name: 'Vikram Seth',
                        image: null,
                    },
                },
                {
                    id: 'c-2',
                    potholeId,
                    userId: 'u-comm-2',
                    content: 'Inspection crew has been dispatched to assess road sub-base depth and prioritize asphalt patching.',
                    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
                    user: {
                        id: 'u-comm-2',
                        name: 'NDMC Municipal Dispatch',
                        image: null,
                    },
                },
            ],
        });
    }

    const comments = await getPotholeComments(potholeId);

    return Response.json({
        success: true,
        data: comments,
    });
});
