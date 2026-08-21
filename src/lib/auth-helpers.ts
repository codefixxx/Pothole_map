import { db } from './db';
import { ForbiddenError, UnauthorizedError, NotFoundError } from './errors';

/**
 * Fetches a user's municipality membership details.
 */
export async function getMunicipalityMember(userId: string) {
    return db.municipalityMember.findUnique({
        where: { userId },
        include: { municipality: true },
    });
}

/**
 * Authorizes a user action on a specific report/pothole.
 * 
 * Rules:
 * - Super Admin (User.role === 'ADMIN') can perform any action on any report.
 * - Citizens (USER role, no municipality membership) cannot verify or change statuses.
 * - Municipality Officers/Managers can only view/verify/modify reports routed to their municipality.
 * - Creator of a report can delete it.
 */
export async function authorizeReportAction(
    userId: string,
    userRole: 'USER' | 'ADMIN',
    potholeId: string,
    action: 'verify' | 'status_update' | 'assign' | 'delete'
) {
    // 1. Super Admin bypass
    if (userRole === 'ADMIN') {
        return true;
    }

    // 2. Fetch the report
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });

    if (!pothole) {
        throw new NotFoundError('Pothole report not found');
    }

    // 3. Deletion rule
    if (action === 'delete') {
        if (pothole.userId !== userId) {
            throw new ForbiddenError('Only the creator of this report or an administrator can delete it.');
        }
        return true;
    }

    // 4. Municipal actions (verify, status_update, assign)
    const member = await db.municipalityMember.findUnique({
        where: { userId },
    });

    if (!member) {
        throw new ForbiddenError('You do not have the required municipal permissions to perform this action.');
    }

    // If report is not assigned to any municipality, only Super Admins can manage it
    if (!pothole.municipalityId) {
        throw new ForbiddenError('This report is in the unassigned queue. Only system administrators can process it.');
    }

    // Verify user belongs to the municipality the report is routed to
    if (pothole.municipalityId !== member.municipalityId) {
        throw new ForbiddenError('You are not authorized to manage reports outside of your municipality.');
    }

    // Manage assignments: Only managers can assign?
    // In section 4: "Managers can reassign or override according to explicit policy."
    // If action is assign and user is not MANAGER, we can enforce it.
    if (action === 'assign' && member.role !== 'MANAGER') {
        throw new ForbiddenError('Only municipality managers can assign reports.');
    }

    return true;
}

/**
 * Uses PostGIS to find which jurisdiction contains the coordinates (longitude, latitude)
 * and returns the corresponding municipalityId.
 * If no jurisdiction contains the coordinates, returns null.
 */
export async function findJurisdictionForCoordinates(
    latitude: number,
    longitude: number
): Promise<string | null> {
    try {
        const result = await db.$queryRaw<Array<{ municipalityId: string }>>`
            SELECT "municipalityId"
            FROM "jurisdiction"
            WHERE ST_Contains(
                boundary,
                ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)
            )
            LIMIT 1;
        `;

        if (result && result.length > 0) {
            return result[0].municipalityId;
        }
        return null;
    } catch (error) {
        console.error('Error querying jurisdiction via PostGIS:', error);
        return null;
    }
}
