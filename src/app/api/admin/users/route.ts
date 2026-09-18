import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.role !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const users = await db.user.findMany({
        where: query
            ? {
                  OR: [
                      { name: { contains: query, mode: 'insensitive' } },
                      { email: { contains: query, mode: 'insensitive' } },
                      { username: { contains: query, mode: 'insensitive' } },
                  ],
              }
            : {},
        take: 30,
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            image: true,
            emailVerified: true,
            municipalityMember: {
                include: {
                    municipality: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return Response.json({
        success: true,
        data: users,
    });
});
