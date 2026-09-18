import { db } from '@/src/lib/db';

export interface LogAuditInput {
    actorId: string;
    action: string; // e.g. 'STATUS_TRANSITION', 'OFFICER_ASSIGNED', 'MUNICIPALITY_CREATED', 'ROLE_UPDATED'
    entityType: 'POTHOLE' | 'MUNICIPALITY' | 'USER' | 'JURISDICTION';
    entityId: string;
    details?: Record<string, any>;
    ipAddress?: string;
}

/**
 * Asynchronously logs a privileged municipal or administrative operation.
 */
export async function logAuditAction(input: LogAuditInput) {
    try {
        const entry = await db.auditLog.create({
            data: {
                actorId: input.actorId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                details: input.details ? JSON.parse(JSON.stringify(input.details)) : undefined,
                ipAddress: input.ipAddress || null,
            },
        });
        return entry;
    } catch (error) {
        console.error('Failed to write audit log entry:', error);
        return null;
    }
}

/**
 * Fetches audit log records with pagination and filters.
 */
export async function getAuditLogs(params: {
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
}) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;

    const [logs, total] = await Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true,
                    },
                },
            },
        }),
        db.auditLog.count({ where }),
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
