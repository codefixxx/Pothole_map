import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import * as potholeService from '@/src/services/pothole.service';

export const POST = asyncHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
        const resolvedParams = await Promise.resolve(params);
        const id = resolvedParams?.id;

        if (!id) {
            throw new AppError('Pothole ID is required', 400);
        }

        const body = await req.json();
        const { officerId, officerName } = body;
        if (!officerId) {
            throw new AppError('Missing officerId in request body', 400);
        }

        // Support demo testing without requiring active db records
        if (id.startsWith('demo-') || id.startsWith('sample-')) {
            return Response.json({
                success: true,
                data: {
                    id,
                    assignedOfficerId: officerId,
                    assignedOfficer: {
                        id: officerId,
                        name: officerName || 'Inspector Assigned',
                    },
                    status: 'ONGOING',
                    updatedAt: new Date().toISOString(),
                },
                message: `Assigned to ${officerName || 'Officer'} successfully.`,
            });
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new AppError('Unauthorized', 401);
        }

        const updated = await potholeService.assignPothole({
            potholeId: id,
            officerId,
            actorId: session.user.id,
            actorRole: session.user.role as 'USER' | 'ADMIN',
        });

        return Response.json({
            success: true,
            data: updated,
            message: 'Officer assigned successfully.',
        });
    }
);
