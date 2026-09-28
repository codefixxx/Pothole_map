import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole, transitionPotholeStatus, assignPothole } from '../src/services/pothole.service';
import { getAuditLogs } from '../src/services/audit.service';
import { LocationSource, Status, MunicipalityRole } from '@prisma/client';

async function main() {
    console.log('=== STARTING MUNICIPAL AUDIT LOG INTEGRATION TESTS ===\n');

    const citizenEmail = 'audit.citizen@pothole.in';
    const officerEmail = 'audit.officer@pothole.in';
    const managerEmail = 'audit.manager@pothole.in';
    const munName = 'Audit Test City';

    // 1. Cleanup
    console.log('Step 1: Cleaning up test records...');
    await db.auditLog.deleteMany({
        where: {
            actor: {
                email: { in: [citizenEmail, officerEmail, managerEmail] }
            }
        }
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } }
    });
    await db.reportAssignment.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } }
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } }
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } }
    });
    const oldMun = await db.municipality.findUnique({ where: { name: munName } });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officerEmail, managerEmail] } }
    });
    console.log('Cleanup finished.\n');

    // 2. Create users & municipality
    console.log('Step 2: Creating municipality and roles (Citizen, Officer, Manager)...');
    const mun = await createMunicipality({ name: munName });

    const citizen = await db.user.create({
        data: { name: 'Audit Citizen', email: citizenEmail, emailVerified: true }
    });
    const officer = await db.user.create({
        data: { name: 'Audit Officer', email: officerEmail, emailVerified: true }
    });
    const manager = await db.user.create({
        data: { name: 'Audit Manager', email: managerEmail, emailVerified: true }
    });

    await addMunicipalityMember({ municipalityId: mun.id, userId: officer.id, role: MunicipalityRole.OFFICER });
    await addMunicipalityMember({ municipalityId: mun.id, userId: manager.id, role: MunicipalityRole.MANAGER });
    console.log('Mock records created.\n');

    // 3. Create Pothole Report
    console.log('Step 3: Creating pothole report as Citizen...');
    const pothole = await createPothole({
        title: 'Dangerous trench on Main St',
        description: 'Deep trench causing traffic delay',
        latitude: 18.1234,
        longitude: 78.5678,
        userId: citizen.id,
        severity: 4,
        locationSource: LocationSource.GPS,
    });
    await db.pothole.update({
        where: { id: pothole.id },
        data: { municipalityId: mun.id },
    });
    console.log(`Created pothole ID: ${pothole.id}\n`);

    // 4. Officer updates status (PENDING -> VERIFIED -> ONGOING)
    console.log('Step 4: Officer performs status transitions (PENDING -> VERIFIED -> ONGOING)...');
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.VERIFIED,
        actorId: officer.id,
        reason: 'On-site verification completed by officer.',
    });
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.ONGOING,
        actorId: officer.id,
        reason: 'Road repair team dispatched on-site.',
    });
    console.log('Status transitions completed.\n');

    // 5. Manager assigns Officer
    console.log('Step 5: Manager assigns Officer to report...');
    await assignPothole({
        potholeId: pothole.id,
        officerId: officer.id,
        actorId: manager.id,
        notes: 'Assigned to Sector 4 Repair Team.',
    });
    console.log('Officer assigned.\n');

    // Small delay to allow async non-blocking audit log promises to settle
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 6. Verify Audit Logs in Database
    console.log('Step 6: Fetching and verifying AuditLog table records...');
    const auditLogsResult = await getAuditLogs({ limit: 50 });
    console.log(`  Total Audit Logs in system: ${auditLogsResult.total}`);

    const potholeAuditLogs = auditLogsResult.logs.filter((l) => l.entityId === pothole.id);
    console.log(`  Audit Logs specifically for Pothole #${pothole.id.slice(0, 6)}: ${potholeAuditLogs.length}`);

    potholeAuditLogs.forEach((log) => {
        console.log(`  - [Action: ${log.action}] Actor: ${log.actor.name} (${log.actor.email})`);
        console.log(`    Details: ${JSON.stringify(log.details)}`);
    });

    if (potholeAuditLogs.length < 3) {
        throw new Error(`FAILED: Expected at least 3 audit log entries for pothole action, but found ${potholeAuditLogs.length}`);
    }

    const hasStatusAudit = potholeAuditLogs.some((l) => l.action.includes('STATUS_TRANSITION'));
    const hasAssignAudit = potholeAuditLogs.some((l) => l.action === 'OFFICER_ASSIGNED');

    if (!hasStatusAudit || !hasAssignAudit) {
        throw new Error('FAILED: Audit logs missing STATUS_TRANSITION or OFFICER_ASSIGNED records.');
    }

    console.log('\n  [OK] Immutable Audit Logs recorded correctly with actor IDs and change details!\n');

    // 7. Cleanup
    console.log('Step 7: Cleanup test records...');
    await db.auditLog.deleteMany({
        where: {
            actor: {
                email: { in: [citizenEmail, officerEmail, managerEmail] }
            }
        }
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } }
    });
    await db.reportAssignment.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } }
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } }
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } }
    });
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officerEmail, managerEmail] } }
    });
    await db.municipality.delete({ where: { id: mun.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL MUNICIPAL AUDIT LOG TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Audit log test failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
