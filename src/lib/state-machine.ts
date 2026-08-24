import { Status, MunicipalityRole } from '@prisma/client';
import { AppError } from './errors';

// Type definitions for validation context
export interface TransitionContext {
    actorRole: 'USER' | 'ADMIN';
    actorMember: {
        municipalityId: string;
        role: MunicipalityRole;
    } | null;
    pothole: {
        id: string;
        status: Status;
        municipalityId: string | null;
    };
}

/**
 * Validates a status transition request based on the centralized transition policy.
 * Throws AppError if the transition or authorization is invalid.
 */
export function validateStatusTransition(
    newStatus: Status,
    context: TransitionContext
): void {
    const oldStatus = context.pothole.status;

    // 1. Check if it's a no-op (same status)
    if (oldStatus === newStatus) {
        throw new AppError(`Report is already in ${newStatus} status.`, 400);
    }

    // 2. Validate structural lifecycle state transitions
    const allowedTransitions: Record<Status, Status[]> = {
        [Status.PENDING]: [Status.VERIFIED, Status.REJECTED],
        [Status.VERIFIED]: [Status.ONGOING],
        [Status.ONGOING]: [Status.FIXED],
        [Status.FIXED]: [Status.PENDING, Status.VERIFIED, Status.ONGOING],
        [Status.REJECTED]: [Status.PENDING],
    };

    const validDestinations = allowedTransitions[oldStatus] || [];
    if (!validDestinations.includes(newStatus)) {
        throw new AppError(
            `Invalid lifecycle transition: Cannot change status from ${oldStatus} to ${newStatus}.`,
            400
        );
    }

    // 3. Super Admin bypasses role-based authority rules
    if (context.actorRole === 'ADMIN') {
        return;
    }

    // 4. Regular citizens (not municipal staff) cannot transition statuses
    if (!context.actorMember) {
        throw new AppError(
            'Forbidden: You do not have the required municipal permissions to update report status.',
            403
        );
    }

    const member = context.actorMember;
    const pothole = context.pothole;

    // 5. Enforce municipal jurisdiction containment
    if (!pothole.municipalityId) {
        throw new AppError(
            'Forbidden: This report is in the unassigned queue. Only administrators can process it.',
            403
        );
    }

    if (pothole.municipalityId !== member.municipalityId) {
        throw new AppError(
            'Forbidden: You are not authorized to manage reports outside of your municipality.',
            403
        );
    }

    // 6. Enforce role restrictions (reopening FIXED/REJECTED is restricted to MANAGERs)
    const isReopening = oldStatus === Status.FIXED || oldStatus === Status.REJECTED;
    if (isReopening && member.role !== MunicipalityRole.MANAGER) {
        throw new AppError(
            'Forbidden: Only municipality managers or administrators can reopen resolved or rejected reports.',
            403
        );
    }
}
