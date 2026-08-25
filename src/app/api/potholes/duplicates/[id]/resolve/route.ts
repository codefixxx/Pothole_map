import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as duplicateService from '@/src/services/duplicate.service';
import { DuplicateStatus } from '@prisma/client';

export const POST = asyncHandler(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id: candidateId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const body = await req.json();
    const { status } = body;

    if (!status || (status !== DuplicateStatus.CONFIRMED && status !== DuplicateStatus.REJECTED)) {
        throw new AppError('Invalid or missing status. Must be CONFIRMED or REJECTED.', 400);
    }

    const resolvedCandidate = await duplicateService.resolveDuplicateCandidate(
        candidateId,
        status as DuplicateStatus,
        session.user.id
    );

    return Response.json({
        success: true,
        data: resolvedCandidate,
    });
});
