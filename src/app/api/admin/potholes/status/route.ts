import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as potholeService from '@/src/services/pothole.service';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const { potholeId, status } = await req.json();
    if (!potholeId || !status) {
        throw new AppError('Missing potholeId or status in request body', 400);
    }

    const validStatuses = ['PENDING', 'VERIFIED', 'ONGOING', 'FIXED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400);
    }

    const updated = await potholeService.updatePotholeStatus(potholeId, status);

    return Response.json({
        success: true,
        data: updated,
    });
});
