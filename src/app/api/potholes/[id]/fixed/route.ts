import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as potholeService from '@/src/services/pothole.service';

export const POST = asyncHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const pothole = await potholeService.getPotholeById(params.id);

        // Only owner or admin can mark fixed
        if (pothole.userId !== session.user.id && session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden', 403);
        }

        const updated = await potholeService.updatePotholeStatus(params.id, 'FIXED');

        return Response.json({
            success: true,
            data: updated,
        });
    }
);
