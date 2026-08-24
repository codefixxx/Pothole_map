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

        const { status, reason } = await req.json();
        if (!status) {
            throw new AppError('Missing status in request body', 400);
        }

        const validStatuses = ['PENDING', 'VERIFIED', 'ONGOING', 'FIXED', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const updated = await potholeService.updatePotholeStatus(
            params.id,
            status,
            session.user.id,
            reason
        );

        return Response.json({
            success: true,
            data: updated,
        });
    }
);
