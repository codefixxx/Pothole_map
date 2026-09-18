import { db } from '@/src/lib/db';
import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';

export const GET = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;

        const pothole = await db.pothole.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        email: true,
                    },
                },
                municipality: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignedOfficer: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                reportImage: true,
                statusHistories: {
                    include: {
                        actor: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                votes: true,
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
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

export const PATCH = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const existingPothole = await db.pothole.findUnique({
            where: { id },
        });

        if (!existingPothole) {
            throw new AppError('Pothole not found', 404);
        }

        if (existingPothole.userId !== session.user.id && session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden: You can only edit your own reports', 403);
        }

        const body = await req.json();
        const { title, description, severity } = body;

        const updatedPothole = await db.pothole.update({
            where: { id },
            data: {
                ...(title ? { title } : {}),
                ...(description ? { description } : {}),
                ...(severity ? { severity: parseInt(severity, 10) } : {}),
            },
        });

        return Response.json({
            success: true,
            data: updatedPothole,
        });
    },
);

export const DELETE = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const existingPothole = await db.pothole.findUnique({
            where: { id },
        });

        if (!existingPothole) {
            throw new AppError('Pothole not found', 404);
        }

        if (existingPothole.userId !== session.user.id && session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden: You can only delete your own reports', 403);
        }

        await db.pothole.delete({
            where: { id },
        });

        return Response.json({
            success: true,
            message: 'Pothole deleted successfully',
        });
    },
);
