import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const notifications = await db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });

    return Response.json({
        success: true,
        data: notifications,
    });
});
