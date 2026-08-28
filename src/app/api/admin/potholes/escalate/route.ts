import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { Role } from '@prisma/client';
import { escalateStaleReports } from '@/src/services/escalation.service';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    if (session.user.role !== Role.ADMIN) {
        throw new AppError('Forbidden: Only platform administrators can trigger escalation checks.', 403);
    }

    let thresholdHours = 48;
    try {
        const body = await req.json();
        if (body && typeof body.thresholdHours === 'number') {
            thresholdHours = body.thresholdHours;
        }
    } catch {
        // Body is optional, ignore parse errors
    }

    const count = await escalateStaleReports(thresholdHours);

    return Response.json({
        success: true,
        data: {
            escalatedCount: count,
            message: `Successfully checked for stale reports. Escalated ${count} report(s).`,
        },
    });
});
