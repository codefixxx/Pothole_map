import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/src/services/audit.service';

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN or municipal MANAGERS can view audit logs
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Requires Admin privileges' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || undefined;
        const entityType = searchParams.get('entityType') || undefined;
        const actorId = searchParams.get('actorId') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const result = await getAuditLogs({
            action,
            entityType,
            actorId,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Audit log API error:', error);
        return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
    }
}
