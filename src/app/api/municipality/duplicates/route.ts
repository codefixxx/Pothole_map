import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import * as duplicateService from '@/src/services/duplicate.service';
import { DuplicateStatus } from '@prisma/client';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') || 'POTENTIAL';

    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    // Authenticated member lookup
    let targetMunicipalityId: string;
    const member = await getMunicipalityMember(session.user.id);

    if (session.user.role === 'ADMIN') {
        const qMunicipalityId = searchParams.get('municipalityId');
        if (qMunicipalityId) {
            targetMunicipalityId = qMunicipalityId;
        } else if (member) {
            targetMunicipalityId = member.municipalityId;
        } else {
            throw new AppError('Missing municipalityId query parameter', 400);
        }
    } else {
        if (!member) {
            throw new AppError('Forbidden: Only municipality members can access duplicate queue', 403);
        }
        targetMunicipalityId = member.municipalityId;
    }

    const duplicateStatus =
        statusParam in DuplicateStatus ? (statusParam as DuplicateStatus) : DuplicateStatus.POTENTIAL;

    const candidates = await duplicateService.getMunicipalityDuplicateCandidates(
        targetMunicipalityId,
        duplicateStatus
    );

    // Format results with computed fields
    const formatted = candidates.map((cand) => {
        const primary = cand.pothole;
        const duplicate = cand.duplicate;
        return {
            id: cand.id,
            potholeId: cand.potholeId,
            duplicateId: cand.duplicateId,
            confidenceScore: cand.confidenceScore,
            status: cand.status,
            createdAt: cand.createdAt,
            pothole: {
                ...primary,
                votesCount: primary.votes?.length || 0,
                commentsCount: primary.comments?.length || 0,
            },
            duplicate: {
                ...duplicate,
                votesCount: duplicate.votes?.length || 0,
                commentsCount: duplicate.comments?.length || 0,
            },
        };
    });

    return Response.json({
        success: true,
        data: formatted,
    });
});
