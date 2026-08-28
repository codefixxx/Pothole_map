import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { addComment, getPotholeComments } from '@/src/services/social.service';
import { commentSchema } from '@/src/lib/validations/social.schema';

export const POST = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { id: potholeId } = params;
    const body = await req.json();

    const result = commentSchema.safeParse(body);
    if (!result.success) {
        throw new AppError(result.error.errors[0].message, 400);
    }

    const comment = await addComment(session.user.id, potholeId, result.data.content);

    return Response.json({
        success: true,
        data: comment,
    });
});

export const GET = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const { id: potholeId } = params;
    const comments = await getPotholeComments(potholeId);

    return Response.json({
        success: true,
        data: comments,
    });
});
