import { logAuditAction, getAuditLogs } from '../../src/services/audit.service';
import { db } from '../../src/lib/db';

export async function runAuditServiceIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Audit Logging Service & Neon PostgreSQL ---');

    const actor = await db.user.findFirst();
    if (!actor) {
        console.error('❌ Integration Test Error: No user found in database');
        return false;
    }

    const testActionName = `INTEGRATION_TEST_ACTION_${Date.now()}`;
    const testEntityId = `pothole-int-id-${Date.now()}`;

    // 1. Insert audit entry to DB
    const entry = await logAuditAction({
        actorId: actor.id,
        action: testActionName,
        entityType: 'POTHOLE',
        entityId: testEntityId,
        details: { verifiedBy: actor.email, status: 'ONGOING' },
        ipAddress: '127.0.0.1',
    });

    if (entry && entry.id) {
        console.log('  ✅ Database Audit Log Insertion: PASSED');
    } else {
        console.error('❌ Database Audit Log Insertion: FAILED');
        return false;
    }

    // 2. Retrieve audit log entry with user relations
    const result = await getAuditLogs({ action: testActionName, limit: 1 });
    if (result.logs.length === 1 && result.logs[0].entityId === testEntityId && result.logs[0].actor.email === actor.email) {
        console.log('  ✅ Database Audit Log Query & User Relation Join: PASSED');
    } else {
        console.error('❌ Database Audit Log Query: FAILED', result);
        return false;
    }

    // 3. Clean up test record
    await (db as any).auditLog.delete({ where: { id: entry.id } });
    console.log('  ✅ Audit Log Record Cleanup: PASSED');

    console.log('✅ Audit Service Integration Suite: ALL 3 TESTS PASSED');
    return true;
}
