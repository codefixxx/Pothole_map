import * as potholeRepo from '@/src/repositories/pothole.repository';
import { CreatePotholeInput } from '@/src/lib/validations/pothole.schema';
import { Status } from '@prisma/client';
import { sendVerificationNotification, sendFixedNotification, sendRejectedNotification, sendOngoingNotification, notifyOfficerAssignment } from './notification.service';
import { AppError } from '../lib/errors';
import { findJurisdictionForCoordinates, authorizeReportAction } from '@/src/lib/auth-helpers';
import { getOrCreateMunicipalityFromOSM } from './municipality.service';
import { db } from '@/src/lib/db';
import { validateStatusTransition } from '@/src/lib/state-machine';
import { enqueuePotholeProcessing } from '@/src/lib/queue';

export async function createPothole(data: CreatePotholeInput) {
    const user = await db.user.findUnique({
        where: { id: data.userId },
    });
    if (!user) {
        throw new AppError('User not found', 404);
    }
    if (!user.emailVerified) {
        throw new AppError('Please verify your email address to report potholes.', 403);
    }

    if (data.latitude < -90 || data.latitude > 90) {
        throw new AppError('Invalid latitude coordinate', 400);
    }
    if (data.longitude < -180 || data.longitude > 180) {
        throw new AppError('Invalid longitude coordinate', 400);
    }

    // Resolve containing jurisdiction using PostGIS ST_Contains
    let municipalityId = await findJurisdictionForCoordinates(data.latitude, data.longitude);

    // Fallback: Resolve via OpenStreetMap Nominatim reverse geocoding if boundary not found locally
    if (!municipalityId) {
        try {
            municipalityId = await getOrCreateMunicipalityFromOSM(data.latitude, data.longitude);
        } catch (error) {
            console.error('Failed to dynamically resolve jurisdiction from OSM:', error);
            municipalityId = null;
        }
    }

    const newPothole = await potholeRepo.create({
        ...data,
        municipalityId,
    });

    try {
        await enqueuePotholeProcessing(newPothole.id, data.image?.storageKey);
    } catch (error) {
        console.error(`Failed to enqueue background processing for pothole ${newPothole.id}:`, error);
    }

    return newPothole;
}

export async function getAllPotholes(page = 1, limit = 20) {
    return potholeRepo.findAll(page, limit);
}

export async function getPotholeById(id: string) {
    const pothole = await potholeRepo.findById(id);
    if (!pothole) {
        throw new AppError('Pothole not found', 404);
    }
    return pothole;
}

export async function findNearbyPotholes(lat: number, lng: number, radiusInKm = 0.5) {
    return potholeRepo.findNearby(lat, lng, radiusInKm);
}

export async function transitionPotholeStatus({
    potholeId,
    newStatus,
    actorId,
    reason,
}: {
    potholeId: string;
    newStatus: Status;
    actorId: string;
    reason?: string;
}) {
    // 1. Fetch user (actor) details with municipal membership relation
    const actor = await db.user.findUnique({
        where: { id: actorId },
        include: { municipalityMember: true },
    });
    if (!actor) {
        throw new AppError('Actor not found', 404);
    }

    // 2. Fetch pothole details
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    const oldStatus = pothole.status;

    // 3. Enforce the state machine transition check
    validateStatusTransition(newStatus, {
        actorRole: actor.role as 'USER' | 'ADMIN',
        actorMember: actor.municipalityMember
            ? {
                  municipalityId: actor.municipalityMember.municipalityId,
                  role: actor.municipalityMember.role,
              }
            : null,
        pothole: {
            id: pothole.id,
            status: pothole.status,
            municipalityId: pothole.municipalityId,
        },
    });

    // 4. Perform database updates and log history atomically in a transaction
    const result = await db.$transaction(async (tx) => {
        const updateData: any = {
            status: newStatus,
        };

        if (newStatus === Status.VERIFIED) {
            updateData.verifiedById = actorId;
            updateData.verifiedAt = new Date();
        } else if (newStatus === Status.FIXED) {
            updateData.fixedAt = new Date();
        }

        const updatedPothole = await tx.pothole.update({
            where: { id: potholeId },
            data: updateData,
            include: {
                reportImage: true,
                votes: true,
                comments: true,
            },
        });

        // Insert immutable transition history record
        await tx.reportStatusHistory.create({
            data: {
                potholeId,
                actorId,
                oldStatus,
                newStatus,
                reason: reason || null,
            },
        });

        return updatedPothole;
    }, {
        timeout: 15000
    });

    // Trigger side-effects (background notifications) after transaction successfully commits
    if (newStatus === Status.VERIFIED) {
        void sendVerificationNotification(pothole.userId, potholeId);
    } else if (newStatus === Status.FIXED) {
        void sendFixedNotification(pothole.userId, potholeId);
    } else if (newStatus === Status.REJECTED) {
        void sendRejectedNotification(pothole.userId, potholeId, reason || undefined);
    } else if (newStatus === Status.ONGOING) {
        void sendOngoingNotification(pothole.userId, potholeId);
    }

    return result;
}

export async function updatePotholeStatus(
    id: string,
    status: Status,
    actorId: string,
    reason?: string
) {
    return transitionPotholeStatus({
        potholeId: id,
        newStatus: status,
        actorId,
        reason,
    });
}

export async function verifyPothole(id: string, adminId: string, reason?: string) {
    return transitionPotholeStatus({
        potholeId: id,
        newStatus: Status.VERIFIED,
        actorId: adminId,
        reason,
    });
}

export async function rejectPothole(id: string, actorId: string, reason?: string) {
    return transitionPotholeStatus({
        potholeId: id,
        newStatus: Status.REJECTED,
        actorId,
        reason,
    });
}

export async function deletePothole(id: string, userId: string, userRole: string) {
    const pothole = await getPotholeById(id);
    if (pothole.userId !== userId && userRole !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }
    return potholeRepo.deletePothole(id);
}

export async function scheduleMarkerRemoval() {
    return potholeRepo.removeExpiredFixedMarkers();
}

export async function assignPothole({
    potholeId,
    officerId,
    actorId,
    actorRole,
}: {
    potholeId: string;
    officerId: string;
    actorId: string;
    actorRole: 'USER' | 'ADMIN';
}) {
    // 1. Fetch pothole
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    // 2. Fetch officer details and check if they belong to the same municipality
    const officer = await db.user.findUnique({
        where: { id: officerId },
        include: { municipalityMember: true },
    });
    if (!officer) {
        throw new AppError('Assigned officer user not found', 404);
    }

    if (!officer.municipalityMember) {
        throw new AppError('Cannot assign report: The target user is not a municipality member.', 400);
    }

    if (pothole.municipalityId !== officer.municipalityMember.municipalityId) {
        throw new AppError('Cannot assign report: The officer is not a member of the responsible municipality.', 400);
    }

    // 3. Enforce reassignment authorization check (Managers/Admins only)
    await authorizeReportAction(actorId, actorRole, potholeId, 'assign');

    const oldStatus = pothole.status;
    let newStatus = oldStatus;

    // Automatically transition PENDING or VERIFIED status to ONGOING when assigned
    if (oldStatus === Status.PENDING || oldStatus === Status.VERIFIED) {
        newStatus = Status.ONGOING;
    }

    // 4. Update database atomically inside a transaction
    const result = await db.$transaction(async (tx) => {
        const updatedPothole = await tx.pothole.update({
            where: { id: potholeId },
            data: {
                assignedOfficerId: officerId,
                status: newStatus,
            },
            include: {
                reportImage: true,
                votes: true,
                comments: true,
            },
        });

        // Log to immutable ReportAssignment log
        await tx.reportAssignment.create({
            data: {
                potholeId,
                officerId,
                assignedById: actorId,
            },
        });

        // Log to status transition logs if status changed
        if (newStatus !== oldStatus) {
            await tx.reportStatusHistory.create({
                data: {
                    potholeId,
                    actorId,
                    oldStatus,
                    newStatus,
                    reason: 'Automated transition due to assignment.',
                },
            });
        }

        return updatedPothole;
    }, {
        timeout: 15000
    });

    // Trigger side-effects (non-blocking)
    void notifyOfficerAssignment(officerId, potholeId, pothole.title);
    if (newStatus !== oldStatus && newStatus === Status.ONGOING) {
        void sendOngoingNotification(pothole.userId, potholeId);
    }

    return result;
}

export async function getMunicipalityDashboardQueue(params: {
    municipalityId: string;
    sortBy?: 'priority' | 'severity' | 'age';
    status?: Status;
    page?: number;
    limit?: number;
}) {
    return potholeRepo.findDashboardQueue(params);
}