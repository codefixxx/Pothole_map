import { NextRequest, NextResponse } from 'next/server';

import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { db } from '@/src/lib/db';

export const GET = asyncHandler(
    async (req: NextRequest) => {
        const username =
            req.nextUrl.searchParams.get(
                'username',
            );

        if (!username) {
            return NextResponse.json({
                available: false,
            });
        }

        const existing =
            await db.user.findUnique({
                where: { username },
            });

        return NextResponse.json({
            available: !existing,
        });
    },
);