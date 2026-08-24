import { db } from '@/src/lib/db';
import { randomUUID } from 'crypto';

export async function create(data: {
    name: string;
    boundary: number[][][];
    municipalityId: string;
}) {
    const id = `jur_${randomUUID().replace(/-/g, '')}`;
    const boundaryGeoJson = JSON.stringify({
        type: 'Polygon',
        coordinates: data.boundary,
    });

    await db.$executeRaw`
        INSERT INTO "jurisdiction" ("id", "name", "boundary", "municipalityId", "createdAt", "updatedAt")
        VALUES (
            ${id},
            ${data.name},
            ST_SetSRID(ST_GeomFromGeoJSON(${boundaryGeoJson}), 4326),
            ${data.municipalityId},
            NOW(),
            NOW()
        )
    `;

    return findById(id);
}

export async function findById(id: string) {
    const results = await db.$queryRaw<any[]>`
        SELECT "id", "name", ST_AsGeoJSON(boundary) as boundary, "municipalityId", "createdAt", "updatedAt"
        FROM "jurisdiction"
        WHERE "id" = ${id}
        LIMIT 1;
    `;

    if (!results || results.length === 0) {
        return null;
    }

    const row = results[0];
    return {
        id: row.id,
        name: row.name,
        boundary: JSON.parse(row.boundary).coordinates,
        municipalityId: row.municipalityId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export async function findByMunicipalityId(municipalityId: string) {
    const results = await db.$queryRaw<any[]>`
        SELECT "id", "name", ST_AsGeoJSON(boundary) as boundary, "municipalityId", "createdAt", "updatedAt"
        FROM "jurisdiction"
        WHERE "municipalityId" = ${municipalityId}
        LIMIT 1;
    `;

    if (!results || results.length === 0) {
        return null;
    }

    const row = results[0];
    return {
        id: row.id,
        name: row.name,
        boundary: JSON.parse(row.boundary).coordinates,
        municipalityId: row.municipalityId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
