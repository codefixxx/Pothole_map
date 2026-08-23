import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { updateMunicipalityMemberSchema } from '@/src/lib/validations/municipality.schema';
import * as municipalityService from '@/src/services/municipality.service';

export const PATCH = asyncHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }
        if (session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden', 403);
        }

        const body = await req.json();
        const validationResult = updateMunicipalityMemberSchema.safeParse(body);

        if (!validationResult.success) {
            throw new AppError(
                validationResult.error.issues[0]?.message || 'Invalid input data',
                400
            );
        }

        const updated = await municipalityService.updateMunicipalityMember(params.id, validationResult.data);

        return Response.json({
            success: true,
            data: updated,
        });
    }
);

export const DELETE = asyncHandler(
    async (req: Request, { params }: { params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }
        if (session.user.role !== 'ADMIN') {
            throw new AppError('Forbidden', 403);
        }

        await municipalityService.removeMunicipalityMember(params.id);

        return Response.json({
            success: true,
            message: 'Municipality member removed successfully',
        });
    }
);
