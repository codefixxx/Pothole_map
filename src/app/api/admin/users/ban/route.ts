import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as adminService from '@/src/services/admin.service';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const { userId } = await req.json();
    if (!userId) {
        throw new AppError('Missing userId in request body', 400);
    }

    const updated = await adminService.banUser(userId);

    return Response.json({
        success: true,
        data: updated,
    });
});
