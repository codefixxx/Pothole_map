import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { createMunicipalitySchema } from '@/src/lib/validations/municipality.schema';
import * as municipalityService from '@/src/services/municipality.service';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const body = await req.json();
    const validationResult = createMunicipalitySchema.safeParse(body);

    if (!validationResult.success) {
        throw new AppError(
            validationResult.error.issues[0]?.message || 'Invalid input data',
            400
        );
    }

    const municipality = await municipalityService.createMunicipality(validationResult.data);

    return Response.json({
        success: true,
        data: municipality,
    });
});
