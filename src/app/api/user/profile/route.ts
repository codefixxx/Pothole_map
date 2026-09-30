import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl } = await req.json();

    const updateData: Record<string, any> = {};
    if (name && typeof name === 'string' && name.trim().length >= 2) {
        updateData.name = name.trim();
    }
    if (avatarUrl && typeof avatarUrl === 'string') {
        updateData.image = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            { error: 'No valid profile updates provided.' },
            { status: 400 },
        );
    }

    const updatedUser = await db.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
        },
    });

    return NextResponse.json({ success: true, user: updatedUser });
}
