import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import * as jurisdictionRepo from '@/src/repositories/jurisdiction.repository';
import * as potholeService from '@/src/services/pothole.service';
import { db } from '@/src/lib/db';
import { Status } from '@prisma/client';

const DEMO_MUNICIPALITY = {
    id: 'demo-munc-ndmc',
    name: 'New Delhi Municipal Council (NDMC)',
    code: 'NDMC-ZONE-1',
    headquarters: 'Palika Kendra, Parliament Street, New Delhi',
};

const DEMO_OFFICERS = [
    { id: 'off-1', name: 'Inspector Rajesh Kumar', role: 'OFFICER', activeCases: 4, email: 'rajesh.kumar@ndmc.gov.in' },
    { id: 'off-2', name: 'Officer Priya Sharma', role: 'OFFICER', activeCases: 2, email: 'priya.sharma@ndmc.gov.in' },
    { id: 'off-3', name: 'Eng. Amit Verma', role: 'OFFICER', activeCases: 5, email: 'amit.verma@ndmc.gov.in' },
    { id: 'off-4', name: 'Lead Inspector Sunita Rao', role: 'MANAGER', activeCases: 1, email: 'sunita.rao@ndmc.gov.in' },
];

const DEMO_JURISDICTION = {
    id: 'demo-jur-ndmc',
    name: 'NDMC Central Capital Jurisdiction',
    municipalityId: 'demo-munc-ndmc',
    boundary: {
        type: 'Polygon',
        coordinates: [
            [
                [77.185, 28.590],
                [77.245, 28.590],
                [77.250, 28.640],
                [77.210, 28.645],
                [77.180, 28.625],
                [77.185, 28.590],
            ],
        ],
    },
};

const DEMO_POTHOLES = [
    {
        id: 'demo-munc-1',
        title: 'Deep crater on Rajpath Outer Junction',
        description: 'Large 40cm pothole on the outer commuter lane causing severe traffic slowdown and hazard for two-wheelers.',
        latitude: 28.6139,
        longitude: 77.2090,
        status: 'PENDING',
        severity: 5,
        priorityScore: 94,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: null,
        assignedOfficer: null,
        votes: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }],
        comments: [{ id: 'c1' }, { id: 'c2' }],
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-munc-2',
        title: 'Asphalt erosion near Connaught Circus',
        description: 'Expanding surface cracks following heavy rainfall. High vehicle traffic impacting sub-base.',
        latitude: 28.6280,
        longitude: 77.2180,
        status: 'VERIFIED',
        severity: 4,
        priorityScore: 82,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: 'off-1',
        assignedOfficer: { id: 'off-1', name: 'Inspector Rajesh Kumar' },
        votes: [{ id: 'v4' }],
        comments: [{ id: 'c3' }],
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-munc-3',
        title: 'Depressed trench cut on Barapullah Link Road',
        description: 'Utility contractor trench sunk 3 inches below road grade. Requires rapid cold-mix leveling before morning transit.',
        latitude: 28.5890,
        longitude: 77.2250,
        status: 'ONGOING',
        severity: 4,
        priorityScore: 78,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: 'off-2',
        assignedOfficer: { id: 'off-2', name: 'Officer Priya Sharma' },
        votes: [{ id: 'v5' }, { id: 'v6' }],
        comments: [{ id: 'c4' }, { id: 'c5' }],
        createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-munc-4',
        title: 'Edge crumbling on Outer Ring Road Flyover ramp',
        description: 'Severe shoulder damage where cars merge. High-speed section.',
        latitude: 28.5600,
        longitude: 77.2100,
        status: 'VERIFIED',
        severity: 3,
        priorityScore: 68,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1584463699039-f9c158ff8458?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: null,
        assignedOfficer: null,
        votes: [{ id: 'v7' }],
        comments: [],
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-munc-5',
        title: 'Resurfaced road segment at Defence Colony',
        description: 'Permanent patch repair and compaction finished. Road reopened to regular transit.',
        latitude: 28.5830,
        longitude: 77.2300,
        status: 'FIXED',
        severity: 2,
        priorityScore: 42,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: 'off-3',
        assignedOfficer: { id: 'off-3', name: 'Eng. Amit Verma' },
        votes: [{ id: 'v8' }, { id: 'v9' }, { id: 'v10' }],
        comments: [{ id: 'c6' }],
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
    {
        id: 'demo-munc-6',
        title: 'Uneven manhole depression on Janpath',
        description: 'Manhole rim exposed by 3 inches on arterial route. Dangerous for evening bikers.',
        latitude: 28.6180,
        longitude: 77.2180,
        status: 'REJECTED',
        severity: 1,
        priorityScore: 25,
        city: 'New Delhi',
        state: 'Delhi',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
        assignedOfficerId: null,
        assignedOfficer: null,
        votes: [],
        comments: [],
        createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    },
];

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const isDemo = searchParams.get('demo') === 'true';

    if (!session && !isDemo) {
        throw new AppError('Unauthorized', 401);
    }

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

    if (!session || isDemo) {
        let filteredPotholes = [...DEMO_POTHOLES];
        if (status) {
            filteredPotholes = filteredPotholes.filter((p) => p.status === status);
        }
        if (sortBy === 'severity') {
            filteredPotholes.sort((a, b) => b.severity - a.severity);
        } else if (sortBy === 'age') {
            filteredPotholes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
            filteredPotholes.sort((a, b) => b.priorityScore - a.priorityScore);
        }

        return Response.json({
            success: true,
            data: {
                municipality: DEMO_MUNICIPALITY,
                jurisdiction: DEMO_JURISDICTION,
                officers: DEMO_OFFICERS,
                potholes: filteredPotholes,
                isDemo: true,
            },
        });
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
