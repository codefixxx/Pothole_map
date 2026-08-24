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

        const { officerId } = await req.json();
        if (!officerId) {
            throw new AppError('Missing officerId in request body', 400);
        }

        const updated = await potholeService.assignPothole({
            potholeId: params.id,
            officerId,
            actorId: session.user.id,
            actorRole: session.user.role as 'USER' | 'ADMIN',
        });

        return Response.json({
            success: true,
            data: updated,
        });
    }
);
