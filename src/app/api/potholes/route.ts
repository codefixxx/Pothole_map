import { db } from '@/src/lib/db';
import { auth } from '@/src/lib/auth';
import { apiHandler } from '@/src/lib/apiHandler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';

export const GET = apiHandler(async () => {
    const potholes = await db.pothole.findMany({
        include: {
            votes: true,
            comments: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return Response.json({
        success: true,
        data: potholes,
    });
});

export const POST = apiHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const body = await req.json();
    const { title, description, latitude, longitude } = body;

    if (!title || !latitude || !longitude) {
        throw new AppError('Missing required fields', 400);
    }

    const pothole = await db.pothole.create({
        data: {
            title,
            description,
            latitude,
            longitude,
            userId: session.user.id,
        },
    });

    return Response.json({
        success: true,
        data: pothole,
    });
});
