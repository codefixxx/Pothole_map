import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { createMunicipalitySchema } from '@/src/lib/validations/municipality.schema';
import * as municipalityService from '@/src/services/municipality.service';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const body = await req.json();
    const validationResult = createMunicipalitySchema.safeParse(body);

    if (!validationResult.success) {
        throw new AppError(
            validationResult.error.issues[0]?.message || 'Invalid input data',
            400
        );
    }

    const municipality = await municipalityService.createMunicipality(validationResult.data);

    return Response.json({
        success: true,
        data: municipality,
    });
});

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const { db } = await import('@/src/lib/db');

    const municipalities = await db.municipality.findMany({
        orderBy: { name: 'asc' },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            image: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    members: true,
                    potholes: true,
                },
            },
        },
    });

    // Fetch jurisdictions via raw query to get GeoJSON strings parsed properly
    const jurisdictions = await db.$queryRaw<any[]>`
        SELECT "id", "name", ST_AsGeoJSON(boundary) as boundary, "municipalityId"
        FROM "jurisdiction"
    `;

    const jurisdictionMap = new Map();
    for (const jur of jurisdictions) {
        try {
            jurisdictionMap.set(jur.municipalityId, {
                id: jur.id,
                name: jur.name,
                boundary: JSON.parse(jur.boundary).coordinates,
            });
        } catch {}
    }

    const result = municipalities.map((m) => ({
        id: m.id,
        name: m.name,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        memberCount: m._count.members,
        potholeCount: m._count.potholes,
        members: m.members,
        jurisdiction: jurisdictionMap.get(m.id) || null,
    }));

    return Response.json({
        success: true,
        data: result,
    });
});

