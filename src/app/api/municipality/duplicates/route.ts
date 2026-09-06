import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import * as duplicateService from '@/src/services/duplicate.service';
import { DuplicateStatus } from '@prisma/client';

export const DEMO_DUPLICATES = [
    {
        id: 'demo-dup-1',
        potholeId: 'demo-munc-1',
        duplicateId: 'demo-munc-dup-1',
        confidenceScore: 0.94,
        visualSimilarity: 0.93,
        distanceInMeters: 14,
        status: 'POTENTIAL',
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        pothole: {
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
            createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            user: { name: 'Kavita Singh' },
            votesCount: 3,
            commentsCount: 2,
        },
        duplicate: {
            id: 'demo-munc-dup-1',
            title: 'Massive pothole near India Gate / Rajpath crossing',
            description: 'Vehicles swerving dangerously into adjacent bus lane to avoid this sunken asphalt pit.',
            latitude: 28.6140,
            longitude: 77.2091,
            status: 'PENDING',
            severity: 4,
            priorityScore: 88,
            city: 'New Delhi',
            state: 'Delhi',
            imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
            createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
            user: { name: 'Vikram Malhotra' },
            votesCount: 5,
            commentsCount: 1,
        },
    },
    {
        id: 'demo-dup-2',
        potholeId: 'demo-munc-2',
        duplicateId: 'demo-munc-dup-2',
        confidenceScore: 0.89,
        visualSimilarity: 0.88,
        distanceInMeters: 28,
        status: 'POTENTIAL',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        pothole: {
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
            createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            user: { name: 'Aakash Verma' },
            votesCount: 1,
            commentsCount: 1,
        },
        duplicate: {
            id: 'demo-munc-dup-2',
            title: 'Road sinking on Outer Circle CP Block B',
            description: 'Asphalt deteriorating around sewer grate. Already damaged two car rims this morning.',
            latitude: 28.6282,
            longitude: 77.2182,
            status: 'PENDING',
            severity: 4,
            priorityScore: 79,
            city: 'New Delhi',
            state: 'Delhi',
            imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=600&auto=format&fit=crop&q=80',
            createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
            user: { name: 'Ritu Sen' },
            votesCount: 4,
            commentsCount: 2,
        },
    },
    {
        id: 'demo-dup-3',
        potholeId: 'demo-munc-3',
        duplicateId: 'demo-munc-dup-3',
        confidenceScore: 0.82,
        visualSimilarity: 0.84,
        distanceInMeters: 45,
        status: 'POTENTIAL',
        createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        pothole: {
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
            createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
            user: { name: 'Sunil Rao' },
            votesCount: 2,
            commentsCount: 2,
        },
        duplicate: {
            id: 'demo-munc-dup-3',
            title: 'Dangerous trench left open by utility crew on Barapullah',
            description: 'Unmarked road excavation with sudden drop. Multiple bikes bottoming out.',
            latitude: 28.5893,
            longitude: 77.2253,
            status: 'PENDING',
            severity: 3,
            priorityScore: 70,
            city: 'New Delhi',
            state: 'Delhi',
            imageUrl: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=600&auto=format&fit=crop&q=80',
            createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
            user: { name: 'Deepak Mehra' },
            votesCount: 1,
            commentsCount: 0,
        },
    },
];

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const isDemo = searchParams.get('demo') === 'true';
    const statusParam = searchParams.get('status') || 'POTENTIAL';

    if (!session && !isDemo) {
        throw new AppError('Unauthorized', 401);
    }

    if (isDemo || !session) {
        const filtered = DEMO_DUPLICATES.filter((d) => d.status === statusParam);
        return Response.json({
            success: true,
            data: filtered,
        });
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

    // Format results with computed fields if needed
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
