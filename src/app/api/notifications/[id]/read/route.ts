import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const PATCH = asyncHandler(async (req, { params }) => {
    const resolvedParams = (await Promise.resolve(params)) as { id?: string } | undefined;
    const id = resolvedParams?.id;

    if (!id) {
        throw new AppError('Notification ID is required', 400);
    }

    // Support demo notification ids for interactive testing without active DB sessions
    if (id.startsWith('demo-')) {
        return Response.json({
            success: true,
            data: { id, read: true },
            message: 'Notification marked as read.',
        });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const notification = await db.notification.findUnique({
        where: { id },
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== session.user.id) {
        throw new AppError('Forbidden', 403);
    }

    const updated = await db.notification.update({
        where: { id },
        data: { read: true },
    });

    return Response.json({
        success: true,
        data: updated,
        message: 'Notification marked as read.',
    });
});
