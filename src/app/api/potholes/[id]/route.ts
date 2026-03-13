import { db } from '@/src/lib/db';
import { auth } from '@/src/lib/auth';
import { apiHandler } from '@/src/lib/apiHandler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';

export const GET = apiHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const pothole = await db.pothole.findUnique({
            where: { id: params.id },
            include: {
                votes: true,
                comments: true,
            },
        });

        if (!pothole) {
            throw new AppError('Pothole not found', 404);
        }

        return Response.json({
            success: true,
            data: pothole,
        });
    },
);

export const PATCH = apiHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const existing = await db.pothole.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            throw new AppError('Pothole not found', 404);
        }

        // Only owner or admin can update
        if (
            existing.userId !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            throw new AppError('Forbidden', 403);
        }

        const body = await req.json();

        const updated = await db.pothole.update({
            where: { id: params.id },
            data: body,
        });

        return Response.json({
            success: true,
            data: updated,
        });
    },
);

export const DELETE = apiHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession(req);
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const existing = await db.pothole.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            throw new AppError('Pothole not found', 404);
        }

        // Only owner or admin
        if (
            existing.userId !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            throw new AppError('Forbidden', 403);
        }

        await db.pothole.delete({
            where: { id: params.id },
        });

        return Response.json({
            success: true,
            message: 'Pothole deleted',
        });
    },
);
