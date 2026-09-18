import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const [
        totalPotholes,
        pendingCount,
        verifiedCount,
        ongoingCount,
        fixedCount,
        rejectedCount,
        escalatedCount,
        totalMunicipalities,
        totalUsers,
        totalStaff,
        jurisdictionCount,
    ] = await Promise.all([
        db.pothole.count(),
        db.pothole.count({ where: { status: 'PENDING' } }),
        db.pothole.count({ where: { status: 'VERIFIED' } }),
        db.pothole.count({ where: { status: 'ONGOING' } }),
        db.pothole.count({ where: { status: 'FIXED' } }),
        db.pothole.count({ where: { status: 'REJECTED' } }),
        db.pothole.count({ where: { escalated: true } }),
        db.municipality.count(),
        db.user.count(),
        db.municipalityMember.count(),
        db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "jurisdiction"`.then(
            (r) => Number(r[0]?.count || 0)
        ).catch(() => 0),
    ]);

    const resolutionRate = totalPotholes > 0 ? Math.round((fixedCount / totalPotholes) * 100) : 0;

    return Response.json({
        success: true,
        data: {
            totalPotholes,
            pendingCount,
            verifiedCount,
            ongoingCount,
            fixedCount,
            rejectedCount,
            escalatedCount,
            totalMunicipalities,
            totalUsers,
            totalStaff,
            jurisdictionCount,
            resolutionRate,
        },
    });
});
