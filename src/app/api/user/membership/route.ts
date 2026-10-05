import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/src/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ isMember: false, role: null });
        }

        if (session.user.role === 'ADMIN') {
            return NextResponse.json({ isMember: true, role: 'ADMIN' });
        }

        const member = await db.municipalityMember.findUnique({
            where: { userId: session.user.id },
            select: { role: true, municipalityId: true },
        });

        if (!member) {
            return NextResponse.json({ isMember: false, role: null });
        }

        return NextResponse.json({
            isMember: true,
            role: member.role,
            municipalityId: member.municipalityId,
        });
    } catch {
        return NextResponse.json({ isMember: false, role: null });
    }
}
