import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

const DEMO_NOTIFICATIONS = [
    {
        id: 'demo-notif-1',
        title: 'Pothole Report Verified',
        message: 'Great news! Your reported hazard on Rajpath Outer Junction (#MPLE-1) has been verified by NDMC and placed in the triage queue.',
        link: '/potholes/sample-1',
        read: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-notif-2',
        title: 'New Comment on Followed Report',
        message: 'Municipal Dispatch posted an update on Barapullah Flyover: "Inspection crew dispatched for depth analysis."',
        link: '/potholes/sample-3',
        read: false,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-notif-3',
        title: 'Repair Completed & Certified',
        message: 'The pothole you confirmed on Outer Ring Road (#MPLE-4) has been successfully patched and resurfaced.',
        link: '/potholes/sample-4',
        read: true,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-notif-4',
        title: 'Duplicate Report Merged',
        message: 'A similar road defect reported 25m away was merged into your active case to consolidate municipal priority.',
        link: '/potholes/sample-2',
        read: true,
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
];

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const url = new URL(req.url);
    const demoMode = url.searchParams.get('demo') === 'true';

    if (!session && !demoMode) {
        throw new AppError('Unauthorized', 401);
    }

    if (!session && demoMode) {
        const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.read).length;
        return Response.json({
            success: true,
            data: DEMO_NOTIFICATIONS,
            unreadCount,
            isDemo: true,
        });
    }

    const notifications = await db.notification.findMany({
        where: { userId: session!.user.id },
        orderBy: { createdAt: 'desc' },
    });

    // If user has no notifications yet and demo mode is requested
    if (notifications.length === 0 && demoMode) {
        const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.read).length;
        return Response.json({
            success: true,
            data: DEMO_NOTIFICATIONS,
            unreadCount,
            isDemo: true,
        });
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    return Response.json({
        success: true,
        data: notifications,
        unreadCount,
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
