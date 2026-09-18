import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { createJurisdictionSchema } from '@/src/lib/validations/municipality.schema';
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
    const validationResult = createJurisdictionSchema.safeParse(body);

    if (!validationResult.success) {
        throw new AppError(
            validationResult.error.issues[0]?.message || 'Invalid input data',
            400
        );
    }

    const jurisdiction = await municipalityService.createJurisdiction(validationResult.data);

    return Response.json({
        success: true,
        data: jurisdiction,
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

    const results = await db.$queryRaw<any[]>`
        SELECT j."id", j."name", ST_AsGeoJSON(j.boundary) as boundary, j."municipalityId", m."name" as "municipalityName"
        FROM "jurisdiction" j
        LEFT JOIN "municipality" m ON j."municipalityId" = m."id"
        ORDER BY j."name" ASC;
    `;

    const jurisdictions = results.map((row) => ({
        id: row.id,
        name: row.name,
        municipalityId: row.municipalityId,
        municipalityName: row.municipalityName || 'Unknown Municipality',
        boundary: JSON.parse(row.boundary).coordinates,
    }));

    return Response.json({
        success: true,
        data: jurisdictions,
    });
});

