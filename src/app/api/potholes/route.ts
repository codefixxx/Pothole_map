import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { createPotholeSchema } from '@/src/lib/validations/pothole.schema';
import * as potholeService from '@/src/services/pothole.service';

export const GET = asyncHandler(async (req: Request) => {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const limit = limitParam ? parseInt(limitParam, 10) : 500;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const potholes = await potholeService.getAllPotholes(page, limit);

    return Response.json({
        success: true,
        data: potholes,
    });
});

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const body = await req.json();
    const validationResult = createPotholeSchema.safeParse({
        ...body,
        userId: session.user.id,
    });

    if (!validationResult.success) {
        throw new AppError(
            validationResult.error.issues[0]?.message || 'Invalid input data',
            400
        );
    }

    const pothole = await potholeService.createPothole(validationResult.data);

    return Response.json({
        success: true,
        data: pothole,
    });
});

