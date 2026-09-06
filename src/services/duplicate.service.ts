import * as duplicateRepository from '@/src/repositories/duplicate.repository';
import { db } from '@/src/lib/db';
import { DuplicateStatus, Status, DuplicateCandidate } from '@prisma/client';
import { AppError } from '@/src/lib/errors';

export interface PotentialDuplicateWithScore {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: Status;
    createdAt: Date;
    distanceInMeters: number;
    confidenceScore: number;
}

/**
 * Detects nearby duplicate reports and computes their confidence scores.
 */
export async function detectNearbyDuplicates(
    latitude: number,
    longitude: number,
    radiusInMeters = 100,
    excludePotholeId?: string | null
): Promise<PotentialDuplicateWithScore[]> {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new AppError('Invalid coordinates', 400);
    }

    const rawCandidates = await duplicateRepository.findDuplicatesByGeom(
        latitude,
        longitude,
        radiusInMeters,
        excludePotholeId
    );

    return rawCandidates.map((candidate) => {
        // Calculate Distance Factor: 1.0 at 0 meters, decaying linearly to 0.0 at radiusInMeters
        const distanceFactor = Math.max(0, 1.0 - (candidate.distanceInMeters / radiusInMeters));

        // Calculate Status Factor
        let statusFactor = 0.0;
        switch (candidate.status) {
            case Status.PENDING:
            case Status.VERIFIED:
            case Status.ONGOING:
                statusFactor = 1.0;
                break;
            case Status.FIXED:
                statusFactor = 0.2; // Low confidence for fixed potholes
                break;
            case Status.REJECTED:
                statusFactor = 0.0; // Rejected reports are ignored
                break;
            default:
                statusFactor = 0.5;
        }

        // Combine using product: high distance and active status yields high confidence
        const confidenceScore = Number((distanceFactor * statusFactor).toFixed(4));

        return {
            ...candidate,
            confidenceScore,
        };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Finds duplicates for an existing pothole.
 */
export async function findDuplicatesForExistingPothole(
    potholeId: string,
    radiusInMeters = 100
): Promise<PotentialDuplicateWithScore[]> {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });

    if (!pothole) {
        throw new AppError('Pothole not found', 404);
    }

    return detectNearbyDuplicates(
        pothole.latitude,
        pothole.longitude,
        radiusInMeters,
        potholeId
    );
}

/**
 * Finds and inserts potential duplicates into the database.
 * Incorporates pgvector image similarity checks if an image embedding is available.
 */
export async function linkDuplicateCandidates(
    potholeId: string,
    radiusInMeters = 100,
    confidenceThreshold = 0.1
): Promise<DuplicateCandidate[]> {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });

    if (!pothole) {
        throw new AppError('Pothole not found', 404);
    }

    // 1. Fetch the pothole's image embedding via raw SQL
    const imageRows = await db.$queryRaw<{ embedding: string | null }[]>`
        SELECT embedding::text FROM "report_image" WHERE "potholeId" = ${potholeId} LIMIT 1;
    `;
    const embeddingText = imageRows[0]?.embedding;
    
    let embedding: number[] | null = null;
    if (embeddingText) {
        embedding = embeddingText.replace('[', '').replace(']', '').split(',').map(Number);
    }

    let duplicates: PotentialDuplicateWithScore[] = [];

    if (embedding) {
        // Run AI-based similarity check
        const rawCandidates = await duplicateRepository.findDuplicatesByGeomAndEmbedding(
            pothole.latitude,
            pothole.longitude,
            radiusInMeters,
            embedding,
            potholeId
        );

        duplicates = rawCandidates.map((candidate) => {
            const distanceFactor = Math.max(0, 1.0 - (candidate.distanceInMeters / radiusInMeters));
            
            let statusFactor = 0.0;
            switch (candidate.status) {
                case Status.PENDING:
                case Status.VERIFIED:
                case Status.ONGOING:
                    statusFactor = 1.0;
                    break;
                case Status.FIXED:
                    statusFactor = 0.2;
                    break;
                case Status.REJECTED:
                    statusFactor = 0.0;
                    break;
                default:
                    statusFactor = 0.5;
            }

            let confidenceScore = 0.0;
            if (candidate.visualSimilarity !== null) {
                // Hybrid calculation: 30% distance weight, 70% visual similarity weight
                confidenceScore = (0.3 * distanceFactor + 0.7 * candidate.visualSimilarity) * statusFactor;
            } else {
                // Fallback to distance only
                confidenceScore = distanceFactor * statusFactor;
            }

            return {
                ...candidate,
                confidenceScore: Number(confidenceScore.toFixed(4)),
            };
        }).sort((a, b) => b.confidenceScore - a.confidenceScore);
    } else {
        // Fallback to standard proximity check
        duplicates = await detectNearbyDuplicates(
            pothole.latitude,
            pothole.longitude,
            radiusInMeters,
            potholeId
        );
    }

    const savedCandidates: DuplicateCandidate[] = [];

    for (const dup of duplicates) {
        if (dup.confidenceScore >= confidenceThreshold) {
            const candidate = await duplicateRepository.createCandidate(
                potholeId,
                dup.id,
                dup.confidenceScore,
                DuplicateStatus.POTENTIAL
            );
            savedCandidates.push(candidate);
        }
    }

    return savedCandidates;
}

/**
 * Resolves a duplicate candidate relationship (CONFIRMED or REJECTED) by a municipal member.
 */
export async function resolveDuplicateCandidate(
    candidateId: string,
    status: DuplicateStatus,
    actorId: string
): Promise<DuplicateCandidate> {
    if (status === DuplicateStatus.POTENTIAL) {
        throw new AppError('Cannot resolve status to POTENTIAL', 400);
    }

    const candidate = await duplicateRepository.findById(candidateId);
    if (!candidate) {
        throw new AppError('Duplicate candidate relationship not found', 404);
    }

    const actor = await db.user.findUnique({
        where: { id: actorId },
        include: { municipalityMember: true },
    });

    if (!actor) {
        throw new AppError('Actor user not found', 404);
    }

    // Validate authorization
    if (actor.role !== 'ADMIN') {
        if (!actor.municipalityMember) {
            throw new AppError('Forbidden: You do not have municipal permissions to resolve duplicates.', 403);
        }

        const memberMunId = actor.municipalityMember.municipalityId;
        const sourceMunId = candidate.pothole.municipalityId;
        const dupMunId = candidate.duplicate.municipalityId;

        // Either source or duplicate report must fall under the actor's municipal jurisdiction
        if (sourceMunId !== memberMunId && dupMunId !== memberMunId) {
            throw new AppError('Forbidden: You are not authorized to resolve duplicate candidates outside of your municipality.', 403);
        }
    }

    const updated = await duplicateRepository.updateCandidateStatus(candidateId, status);

    if (status === DuplicateStatus.CONFIRMED) {
        // Mark the secondary duplicate report as REJECTED and log transition history
        try {
            await db.pothole.update({
                where: { id: candidate.duplicateId },
                data: { status: Status.REJECTED },
            });

            await db.reportStatusHistory.create({
                data: {
                    potholeId: candidate.duplicateId,
                    actorId,
                    oldStatus: candidate.duplicate.status,
                    newStatus: Status.REJECTED,
                    reason: `Consolidated as duplicate of primary report #${candidate.potholeId.slice(-6)}`,
                },
            });
        } catch (err) {
            console.error('Failed to update duplicate pothole status on confirmation:', err);
        }
    }

    return updated;
}

/**
 * Retrieves pending or resolved duplicate candidate pairs for a municipality.
 */
export async function getMunicipalityDuplicateCandidates(
    municipalityId: string,
    status: DuplicateStatus = DuplicateStatus.POTENTIAL
) {
    return duplicateRepository.findCandidatesForMunicipality(municipalityId, status);
}
