import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        return Response.json({
            success: true,
            data: [],
            unreadCount: 0,
            isGuest: true,
        });
    }

    const notifications = await db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return Response.json({
        success: true,
        data: notifications,
        unreadCount,
        isGuest: false,
    });
});

export const PATCH = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session) {
        await db.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false,
            },
            data: {
                read: true,
            },
        });
    }

    return Response.json({
        success: true,
        message: 'All notifications marked as read.',
    });
});
