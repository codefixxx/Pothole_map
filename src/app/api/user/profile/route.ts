import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';
import { NextResponse } from 'next/server';
export async function PATCH(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { avatarUrl } = await req.json();
    if (!avatarUrl)
        return NextResponse.json(
            { error: 'Missing avatarUrl' },
            { status: 400 },
        );
    await db.user.update({
        where: { id: session.user.id },
        data: { image: avatarUrl },
    });
    return NextResponse.json({ success: true });
}
