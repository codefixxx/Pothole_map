import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import * as jurisdictionRepo from '@/src/repositories/jurisdiction.repository';
import * as potholeService from '@/src/services/pothole.service';
import { db } from '@/src/lib/db';
import { Status } from '@prisma/client';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const qMunicipalityId = searchParams.get('municipalityId');
    const sortBy = (searchParams.get('sortBy') as 'priority' | 'severity' | 'age') || 'priority';
    const qStatus = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (sortBy && !['priority', 'severity', 'age'].includes(sortBy)) {
        throw new AppError('Invalid sortBy parameter', 400);
    }

    let status: Status | undefined = undefined;
    if (qStatus) {
        if (!Object.values(Status).includes(qStatus as Status)) {
            throw new AppError('Invalid status parameter', 400);
        }
        status = qStatus as Status;
    }

    // Resolve caller's municipality access
    const member = await getMunicipalityMember(session.user.id);
    let targetMunicipalityId: string;
    let municipalityName = '';

    if (session.user.role === 'ADMIN') {
        // Admins can view any municipality's dashboard
        if (qMunicipalityId) {
            targetMunicipalityId = qMunicipalityId;
        } else if (member) {
            targetMunicipalityId = member.municipalityId;
        } else {
            throw new AppError('Missing municipalityId query parameter', 400);
        }

        const mun = await db.municipality.findUnique({
            where: { id: targetMunicipalityId },
        });
        if (!mun) {
            throw new AppError('Municipality not found', 404);
        }
        municipalityName = mun.name;
    } else {
        // Regular municipal officers/managers are restricted to their own municipality
        if (!member) {
            throw new AppError('Forbidden: Only municipality members can access this dashboard', 403);
        }
        if (qMunicipalityId && qMunicipalityId !== member.municipalityId) {
            throw new AppError('Forbidden: You are not authorized to view this municipality\'s dashboard', 403);
        }
        targetMunicipalityId = member.municipalityId;
        municipalityName = member.municipality.name;
    }

    // Fetch jurisdiction details (the boundary)
    const jurisdiction = await jurisdictionRepo.findByMunicipalityId(targetMunicipalityId);

    // Fetch queue
    const potholes = await potholeService.getMunicipalityDashboardQueue({
        municipalityId: targetMunicipalityId,
        sortBy,
        status,
        page,
        limit,
    });

    return Response.json({
        success: true,
        data: {
            municipality: {
                id: targetMunicipalityId,
                name: municipalityName,
            },
            jurisdiction,
            potholes,
        },
    });
});
