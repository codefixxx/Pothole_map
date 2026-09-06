import { db } from '@/src/lib/db';
import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';

const SAMPLE_POTHOLES: Record<string, any> = {
    'sample-1': {
        id: 'sample-1',
        title: 'Deep crater on Rajpath Outer Junction',
        description: 'Large 40cm pothole on the outer commuter lane causing severe traffic slowdown and hazard for two-wheelers. Water accumulates during rains.',
        latitude: 28.6139,
        longitude: 77.209,
        locationAccuracy: 4,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        status: 'PENDING',
        severity: 8,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        user: { id: 'u-1', name: 'Aarav Sharma', image: null, email: 'aarav.sharma@example.com' },
        municipality: { id: 'mun-1', name: 'New Delhi Municipal Council (NDMC)' },
        assignedOfficer: null,
        statusHistories: [
            {
                id: 'sh-1',
                potholeId: 'sample-1',
                actorId: 'u-1',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Hazard reported via civic web app with accurate GPS lock.',
                createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                actor: { id: 'u-1', name: 'Aarav Sharma', role: 'USER' },
            },
        ],
        votes: Array(19).fill({ id: 'v', userId: 'mock' }),
        comments: [
            {
                id: 'c-1',
                content: 'I almost lost control of my scooter here yesterday evening. Please fix ASAP!',
                createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                user: { id: 'u-comm-1', name: 'Vikram Seth', image: null },
            },
        ],
    },
    'sample-2': {
        id: 'sample-2',
        title: 'Asphalt erosion near Connaught Circus',
        description: 'Expanding surface cracks following heavy rainfall. High vehicle traffic impacting sub-base integrity.',
        latitude: 28.628,
        longitude: 77.218,
        locationAccuracy: 6,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=800&auto=format&fit=crop&q=80',
        status: 'PENDING',
        severity: 5,
        createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
        user: { id: 'u-2', name: 'Neha Gupta', image: null, email: 'neha.gupta@example.com' },
        municipality: { id: 'mun-1', name: 'New Delhi Municipal Council (NDMC)' },
        assignedOfficer: null,
        statusHistories: [
            {
                id: 'sh-2-1',
                potholeId: 'sample-2',
                actorId: 'u-2',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Citizen report submitted with road erosion photo.',
                createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
                actor: { id: 'u-2', name: 'Neha Gupta', role: 'USER' },
            },
        ],
        votes: Array(11).fill({ id: 'v', userId: 'mock' }),
        comments: [],
    },
    'sample-3': {
        id: 'sample-3',
        title: 'Road subsidence on Lodhi Road flyover',
        description: 'Structural roadbed sinking; verified by municipal patrol team and scheduled for resurfacing.',
        latitude: 28.602,
        longitude: 77.225,
        locationAccuracy: 3,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
        status: 'VERIFIED',
        severity: 9,
        verifiedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        user: { id: 'u-3', name: 'Rohan Mehra', image: null, email: 'rohan.mehra@example.com' },
        municipality: { id: 'mun-2', name: 'Municipal Corporation of Delhi (MCD)' },
        assignedOfficer: { id: 'off-1', name: 'Officer Rajesh Kumar', image: null },
        statusHistories: [
            {
                id: 'sh-3-2',
                potholeId: 'sample-3',
                actorId: 'off-1',
                oldStatus: 'PENDING',
                newStatus: 'VERIFIED',
                reason: 'Field inspection confirmed significant roadbed subsidence on approach ramp.',
                createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
                actor: { id: 'off-1', name: 'Officer Rajesh Kumar', role: 'ADMIN' },
            },
            {
                id: 'sh-3-1',
                potholeId: 'sample-3',
                actorId: 'u-3',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Commuter report filed.',
                createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
                actor: { id: 'u-3', name: 'Rohan Mehra', role: 'USER' },
            },
        ],
        votes: Array(28).fill({ id: 'v', userId: 'mock' }),
        comments: [
            {
                id: 'c-3-1',
                content: 'Dangerous spot, glad to see it verified so quickly by MCD.',
                createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
                user: { id: 'u-comm-2', name: 'Sunita Rao', image: null },
            },
        ],
    },
    'sample-4': {
        id: 'sample-4',
        title: 'Excavation trench repair ongoing',
        description: 'Contractor crew on-site backfilling and leveling asphalt surface following utility maintenance.',
        latitude: 28.591,
        longitude: 77.215,
        locationAccuracy: 5,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1584463699039-f9c158ff8458?w=800&auto=format&fit=crop&q=80',
        status: 'ONGOING',
        severity: 6,
        verifiedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        user: { id: 'u-4', name: 'Kavita Chawla', image: null, email: 'kavita.c@example.com' },
        municipality: { id: 'mun-2', name: 'Municipal Corporation of Delhi (MCD)' },
        assignedOfficer: { id: 'off-2', name: 'Engineer Sunita Verma', image: null },
        statusHistories: [
            {
                id: 'sh-4-3',
                potholeId: 'sample-4',
                actorId: 'off-2',
                oldStatus: 'VERIFIED',
                newStatus: 'ONGOING',
                reason: 'Field repair team dispatched with cold-mix asphalt patch material.',
                createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
                actor: { id: 'off-2', name: 'Engineer Sunita Verma', role: 'ADMIN' },
            },
            {
                id: 'sh-4-2',
                potholeId: 'sample-4',
                actorId: 'off-1',
                oldStatus: 'PENDING',
                newStatus: 'VERIFIED',
                reason: 'Validated by zonal inspection patrol.',
                createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
                actor: { id: 'off-1', name: 'Officer Rajesh Kumar', role: 'ADMIN' },
            },
            {
                id: 'sh-4-1',
                potholeId: 'sample-4',
                actorId: 'u-4',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Initial report filed.',
                createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
                actor: { id: 'u-4', name: 'Kavita Chawla', role: 'USER' },
            },
        ],
        votes: Array(15).fill({ id: 'v', userId: 'mock' }),
        comments: [],
    },
    'sample-5': {
        id: 'sample-5',
        title: 'Resurfaced road segment at Defence Colony',
        description: 'Permanent patch repair and roller compaction finished. Road reopened to regular transit with before/after documentation.',
        latitude: 28.583,
        longitude: 77.23,
        locationAccuracy: 2,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        fixedImageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
        status: 'FIXED',
        severity: 3,
        verifiedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        fixedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        user: { id: 'u-5', name: 'Devendra Joshi', image: null, email: 'devendra.j@example.com' },
        municipality: { id: 'mun-2', name: 'Municipal Corporation of Delhi (MCD)' },
        assignedOfficer: { id: 'off-2', name: 'Engineer Sunita Verma', image: null },
        statusHistories: [
            {
                id: 'sh-5-4',
                potholeId: 'sample-5',
                actorId: 'off-2',
                oldStatus: 'ONGOING',
                newStatus: 'FIXED',
                reason: 'Full roadbed repaving and compaction finalized. Quality control checklist verified.',
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                actor: { id: 'off-2', name: 'Engineer Sunita Verma', role: 'ADMIN' },
            },
            {
                id: 'sh-5-3',
                potholeId: 'sample-5',
                actorId: 'off-2',
                oldStatus: 'VERIFIED',
                newStatus: 'ONGOING',
                reason: 'Work started on road reconstruction.',
                createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
                actor: { id: 'off-2', name: 'Engineer Sunita Verma', role: 'ADMIN' },
            },
            {
                id: 'sh-5-2',
                potholeId: 'sample-5',
                actorId: 'off-1',
                oldStatus: 'PENDING',
                newStatus: 'VERIFIED',
                reason: 'Verified by municipal officer.',
                createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
                actor: { id: 'off-1', name: 'Officer Rajesh Kumar', role: 'ADMIN' },
            },
            {
                id: 'sh-5-1',
                potholeId: 'sample-5',
                actorId: 'u-5',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Reported by local resident.',
                createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
                actor: { id: 'u-5', name: 'Devendra Joshi', role: 'USER' },
            },
        ],
        votes: Array(34).fill({ id: 'v', userId: 'mock' }),
        comments: [
            {
                id: 'c-5-1',
                content: 'The repair is super smooth! Thanks to MCD for resolving this before monsoons.',
                createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
                user: { id: 'u-comm-3', name: 'Karan Malhotra', image: null },
            },
        ],
    },
    'sample-6': {
        id: 'sample-6',
        title: 'Uneven manhole depression',
        description: 'Manhole rim exposed by 3 inches on arterial route. Dangerous for evening two-wheelers and bicycles.',
        latitude: 28.636,
        longitude: 77.202,
        locationAccuracy: 4,
        locationSource: 'GPS',
        captureTimestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80',
        status: 'PENDING',
        severity: 8,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        user: { id: 'u-6', name: 'Manish Tyagi', image: null, email: 'manish.tyagi@example.com' },
        municipality: { id: 'mun-1', name: 'New Delhi Municipal Council (NDMC)' },
        assignedOfficer: null,
        statusHistories: [
            {
                id: 'sh-6-1',
                potholeId: 'sample-6',
                actorId: 'u-6',
                oldStatus: 'PENDING',
                newStatus: 'PENDING',
                reason: 'Citizen report filed with hazard photos.',
                createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
                actor: { id: 'u-6', name: 'Manish Tyagi', role: 'USER' },
            },
        ],
        votes: Array(22).fill({ id: 'v', userId: 'mock' }),
        comments: [],
    },
};

export const GET = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;

        let pothole: any = null;

        try {
            pothole = await db.pothole.findUnique({
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
        } catch {
            // In case DB lookup fails or is unavailable
        }

        // Fallback to sample data for mock/demo IDs
        if (!pothole && SAMPLE_POTHOLES[id]) {
            pothole = SAMPLE_POTHOLES[id];
        }

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

        const existing = await db.pothole.findUnique({
            where: { id },
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
            where: { id },
            data: body,
        });

        return Response.json({
            success: true,
            data: updated,
        });
    },
);

export const DELETE = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;

        const session = await auth.api.getSession(req);
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const existing = await db.pothole.findUnique({
            where: { id },
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
            where: { id },
        });

        return Response.json({
            success: true,
            message: 'Pothole deleted',
        });
    },
);
