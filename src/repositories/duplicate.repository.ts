import { db } from '@/src/lib/db';
import { DuplicateStatus, Status, DuplicateCandidate } from '@prisma/client';

export interface PotentialDuplicateRaw {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: Status;
    createdAt: Date;
    distanceInMeters: number;
}

/**
 * Uses PostGIS to find potholes in a given radius from coordinates, excluding an optional ID.
 * Returns sorted by status (active first), distance, and creation age.
 */
export async function findDuplicatesByGeom(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
    excludePotholeId?: string | null
): Promise<PotentialDuplicateRaw[]> {
    const excludeId = excludePotholeId ?? null;
    return db.$queryRaw<PotentialDuplicateRaw[]>`
        SELECT 
            p.id,
            p.title,
            p.description,
            p.latitude,
            p.longitude,
            p.status,
            p."createdAt",
            ST_Distance(
                ST_SetSRID(ST_Point(p.longitude, p.latitude), 4326)::geography,
                ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography
            ) AS "distanceInMeters"
        FROM "Pothole" p
        WHERE ST_DWithin(
            ST_SetSRID(ST_Point(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography,
            ${radiusInMeters}
        )
        AND (${excludeId}::text IS NULL OR p.id != ${excludeId})
        ORDER BY 
            CASE 
                WHEN p.status IN ('PENDING', 'VERIFIED', 'ONGOING') THEN 0 
                ELSE 1 
            END ASC,
            "distanceInMeters" ASC,
            p."createdAt" DESC
        LIMIT 10;
    `;
}

export interface PotentialDuplicateWithEmbeddingRaw extends PotentialDuplicateRaw {
    visualSimilarity: number | null;
}

/**
 * Uses PostGIS and pgvector to find potholes within a given radius,
 * computing geodistance and cosine similarity to the query embedding.
 */
export async function findDuplicatesByGeomAndEmbedding(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
    embedding: number[],
    excludePotholeId?: string | null
): Promise<PotentialDuplicateWithEmbeddingRaw[]> {
    const excludeId = excludePotholeId ?? null;
    const embeddingStr = `[${embedding.join(',')}]`;

    return db.$queryRaw<PotentialDuplicateWithEmbeddingRaw[]>`
        SELECT 
            p.id,
            p.title,
            p.description,
            p.latitude,
            p.longitude,
            p.status,
            p."createdAt",
            ST_Distance(
                ST_SetSRID(ST_Point(p.longitude, p.latitude), 4326)::geography,
                ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography
            ) AS "distanceInMeters",
            CASE 
                WHEN ri.embedding IS NOT NULL THEN (1.0 - (ri.embedding <=> ${embeddingStr}::vector))
                ELSE NULL
            END AS "visualSimilarity"
        FROM "Pothole" p
        LEFT JOIN "report_image" ri ON p.id = ri."potholeId"
        WHERE ST_DWithin(
            ST_SetSRID(ST_Point(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography,
            ${radiusInMeters}
        )
        AND (${excludeId}::text IS NULL OR p.id != ${excludeId})
        ORDER BY 
            CASE 
                WHEN p.status IN ('PENDING', 'VERIFIED', 'ONGOING') THEN 0 
                ELSE 1 
            END ASC,
            "distanceInMeters" ASC
        LIMIT 10;
    `;
}


/**
 * Creates or updates a DuplicateCandidate record.
 */
export async function createCandidate(
    potholeId: string,
    duplicateId: string,
    confidenceScore: number,
    status: DuplicateStatus = DuplicateStatus.POTENTIAL
): Promise<DuplicateCandidate> {
    return db.duplicateCandidate.upsert({
        where: {
            potholeId_duplicateId: {
                potholeId,
                duplicateId,
            },
        },
        update: {
            confidenceScore,
            status,
        },
        create: {
            potholeId,
            duplicateId,
            confidenceScore,
            status,
        },
    });
}

/**
 * Retrieves all duplicate candidates associated with a pothole (either as source or duplicate).
 */
export async function findCandidatesForPothole(potholeId: string) {
    return db.duplicateCandidate.findMany({
        where: {
            OR: [
                { potholeId },
                { duplicateId: potholeId },
            ],
        },
        include: {
            pothole: true,
            duplicate: true,
        },
        orderBy: {
            confidenceScore: 'desc',
        },
    });
}

/**
 * Find a duplicate candidate by ID.
 */
export async function findById(candidateId: string) {
    return db.duplicateCandidate.findUnique({
        where: { id: candidateId },
        include: {
            pothole: true,
            duplicate: true,
        },
    });
}

/**
 * Updates a duplicate candidate's status.
 */
export async function updateCandidateStatus(
    candidateId: string,
    status: DuplicateStatus
): Promise<DuplicateCandidate> {
    return db.duplicateCandidate.update({
        where: { id: candidateId },
        data: { status },
    });
}

/**
 * Retrieves all duplicate candidates associated with a municipality.
 */
export async function findCandidatesForMunicipality(
    municipalityId: string,
    status: DuplicateStatus = DuplicateStatus.POTENTIAL
) {
    return db.duplicateCandidate.findMany({
        where: {
            status,
            OR: [
                { pothole: { municipalityId } },
                { duplicate: { municipalityId } },
            ],
        },
        include: {
            pothole: {
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    votes: { select: { id: true } },
                    comments: { select: { id: true } },
                    assignedOfficer: { select: { id: true, name: true } },
                },
            },
            duplicate: {
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    votes: { select: { id: true } },
                    comments: { select: { id: true } },
                    assignedOfficer: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: {
            confidenceScore: 'desc',
        },
    });
}
