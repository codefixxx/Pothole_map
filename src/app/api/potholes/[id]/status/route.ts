import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as potholeService from '@/src/services/pothole.service';

export const PATCH = asyncHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const pothole = await potholeService.getPotholeById(params.id);

        // Only owner or admin
        if (pothole.userId !== session.user.id && session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden', 403);
        }

        const { status } = await req.json();
        if (!status) {
            throw new AppError('Missing status in request body', 400);
        }

        const validStatuses = ['PENDING', 'VERIFIED', 'ONGOING', 'FIXED', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const updated = await potholeService.updatePotholeStatus(params.id, status);

        return Response.json({
            success: true,
            data: updated,
        });
    }
);
