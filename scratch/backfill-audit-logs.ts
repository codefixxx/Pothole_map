import { db } from '../src/lib/db';
import { logAuditAction } from '../src/services/audit.service';

async function backfill() {
  console.log('Backfilling historical status transitions and assignments into AuditLog table...');

  // 1. Backfill Status History
  const statusHistories = await db.reportStatusHistory.findMany({
    include: {
      pothole: true,
      actor: true,
    }
  });

  for (const item of statusHistories) {
    const existing = await db.auditLog.findFirst({
      where: {
        entityType: 'POTHOLE',
        entityId: item.potholeId,
        createdAt: item.createdAt,
      }
    });

    if (!existing) {
      await db.auditLog.create({
        data: {
          actorId: item.actorId,
          action: `STATUS_TRANSITION_${item.oldStatus}_TO_${item.newStatus}`,
          entityType: 'POTHOLE',
          entityId: item.potholeId,
          details: {
            description: `Transitioned status from ${item.oldStatus} to ${item.newStatus}${item.reason ? `: "${item.reason}"` : ''}`,
            title: item.pothole?.title || 'Report',
            oldStatus: item.oldStatus,
            newStatus: item.newStatus,
            reason: item.reason || null,
          },
          createdAt: item.createdAt,
        }
      });
      console.log(`Backfilled StatusTransition #${item.id} (${item.oldStatus} ➔ ${item.newStatus}) by ${item.actor?.email}`);
    }
  }

  // 2. Backfill Assignments
  const assignments = await db.reportAssignment.findMany({
    include: {
      pothole: true,
      officer: true,
      assignedBy: true,
    }
  });

  for (const item of assignments) {
    const existing = await db.auditLog.findFirst({
      where: {
        entityType: 'POTHOLE',
        entityId: item.potholeId,
        createdAt: item.createdAt,
      }
    });

    if (!existing) {
      await db.auditLog.create({
        data: {
          actorId: item.assignedById,
          action: 'OFFICER_ASSIGNED',
          entityType: 'POTHOLE',
          entityId: item.potholeId,
          details: {
            description: `Assigned officer ${item.officer?.name || item.officer?.email} (${item.officer?.email}) to report`,
            title: item.pothole?.title || 'Report',
            officerEmail: item.officer?.email,
            officerName: item.officer?.name,
          },
          createdAt: item.createdAt,
        }
      });
      console.log(`Backfilled Assignment #${item.id} (Officer: ${item.officer?.email}) by ${item.assignedBy?.email}`);
    }
  }

  console.log('Backfill completed successfully!');
}

backfill().then(() => process.exit(0)).catch(console.error);
