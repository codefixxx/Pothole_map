import { db } from '../src/lib/db';
import { createPothole, transitionPotholeStatus, assignPothole } from '../src/services/pothole.service';
import { Status, MunicipalityRole } from '@prisma/client';

async function runFullScenarioTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE EDGE-CASE & LIFECYCLE INTEGRATION TESTS 🧪');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Setup Municipality: Kalaburagi
    let kalaburagi = await db.municipality.findUnique({
      where: { name: 'Kalaburagi Municipality' }
    });
    if (!kalaburagi) {
      kalaburagi = await db.municipality.create({
        data: { name: 'Kalaburagi Municipality' }
      });
      console.log(`Created Municipality: Kalaburagi (ID: ${kalaburagi.id})`);
    }

    // 2. Setup Municipality: Delhi (for cross-jurisdiction edge case test)
    let delhi = await db.municipality.findUnique({
      where: { name: 'New Delhi Municipality' }
    });
    if (!delhi) {
      delhi = await db.municipality.create({
        data: { name: 'New Delhi Municipality' }
      });
    }

    // 3. Setup Users: Citizen, Officer1, Kalaburagi Manager, Delhi Manager, Admin
    const citizenEmail = 'citizen@gmail.com';
    const officer1Email = 'officer1@gmail.com';
    const managerEmail = 'manager.kalaburagi@pothole.in';
    const delhiManagerEmail = 'manager.delhi@pothole.in';
    const adminEmail = 'admin@test.in';

    let citizen = await db.user.findUnique({ where: { email: citizenEmail } });
    if (!citizen) {
      citizen = await db.user.create({
        data: { name: 'Kalaburagi Citizen', email: citizenEmail, emailVerified: true, role: 'USER' }
      });
    }

    let officer1 = await db.user.findUnique({ where: { email: officer1Email } });
    if (!officer1) {
      officer1 = await db.user.create({
        data: { name: 'Kalaburagi Field Officer 1', email: officer1Email, emailVerified: true, role: 'USER' }
      });
    }
    await db.municipalityMember.upsert({
      where: { userId: officer1.id },
      update: { municipalityId: kalaburagi.id, role: MunicipalityRole.OFFICER },
      create: { userId: officer1.id, municipalityId: kalaburagi.id, role: MunicipalityRole.OFFICER }
    });

    let manager = await db.user.findUnique({ where: { email: managerEmail } });
    if (!manager) {
      manager = await db.user.create({
        data: { name: 'Kalaburagi Manager', email: managerEmail, emailVerified: true, role: 'USER' }
      });
    }
    await db.municipalityMember.upsert({
      where: { userId: manager.id },
      update: { municipalityId: kalaburagi.id, role: MunicipalityRole.MANAGER },
      create: { userId: manager.id, municipalityId: kalaburagi.id, role: MunicipalityRole.MANAGER }
    });

    let delhiManager = await db.user.findUnique({ where: { email: delhiManagerEmail } });
    if (!delhiManager) {
      delhiManager = await db.user.create({
        data: { name: 'Delhi Manager', email: delhiManagerEmail, emailVerified: true, role: 'USER' }
      });
    }
    await db.municipalityMember.upsert({
      where: { userId: delhiManager.id },
      update: { municipalityId: delhi.id, role: MunicipalityRole.MANAGER },
      create: { userId: delhiManager.id, municipalityId: delhi.id, role: MunicipalityRole.MANAGER }
    });

    let admin = await db.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      admin = await db.user.create({
        data: { name: 'Super Admin', email: adminEmail, emailVerified: true, role: 'ADMIN' }
      });
    }

    console.log(`Users Configured: Citizen(${citizen.email}), Officer(${officer1.email}), Manager(${manager.email}), DelhiManager(${delhiManager.email}), Admin(${admin.email})\n`);

    // ----------------------------------------------------------------
    // SCENARIO 1: Citizen Report Creation & Routing
    // ----------------------------------------------------------------
    console.log('🔹 SCENARIO 1: Citizen Report Creation');
    const pothole1 = await createPothole({
      userId: citizen.id,
      title: 'Deep pothole near Station Road Kalaburagi',
      description: 'Dangerous 15cm pothole causing traffic slowdown.',
      severity: 8,
      latitude: 17.3297,
      longitude: 76.8343,
      locationSource: 'GPS',
      city: 'Kalaburagi',
    });
    assert(!!pothole1.id, 'Pothole created by Citizen');
    assert(pothole1.status === Status.PENDING, 'Initial status is PENDING');

    // Link to Kalaburagi Municipality
    await db.pothole.update({
      where: { id: pothole1.id },
      data: { municipalityId: kalaburagi.id }
    });

    // ----------------------------------------------------------------
    // SCENARIO 2: Edge Case - Citizen tries status transition
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 2: Edge Case - Citizen status transition');
    try {
      await transitionPotholeStatus({
        potholeId: pothole1.id,
        newStatus: Status.VERIFIED,
        actorId: citizen.id,
      });
      assert(false, 'Citizen status transition MUST fail');
    } catch (err: any) {
      assert(err.statusCode === 403 || err.message.includes('Forbidden'), 'Citizen status transition correctly rejected with 403 Forbidden');
    }

    // ----------------------------------------------------------------
    // SCENARIO 3: Edge Case - Cross-Jurisdiction Manager Action
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 3: Edge Case - Manager from Delhi tries to manage Kalaburagi pothole');
    try {
      await assignPothole({
        potholeId: pothole1.id,
        officerId: officer1.id,
        actorId: delhiManager.id,
        actorRole: 'USER',
      });
      assert(false, 'Cross-jurisdiction manager action MUST fail');
    } catch (err: any) {
      assert(err.statusCode === 403 || err.message.includes('outside of your municipality'), 'Cross-jurisdiction manager action correctly rejected with 403 Forbidden');
    }

    // ----------------------------------------------------------------
    // SCENARIO 4: Kalaburagi Manager assigns Officer 1
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 4: Kalaburagi Manager Assignment & Auto-Transition');
    const assignedPothole = await assignPothole({
      potholeId: pothole1.id,
      officerId: officer1.id,
      actorId: manager.id,
      actorRole: 'USER',
    });
    assert(assignedPothole.assignedOfficerId === officer1.id, 'Officer 1 assigned to Kalaburagi pothole');
    assert(assignedPothole.assignedOfficer?.email === officer1Email, 'Assigned officer populated in return object');
    assert(assignedPothole.status === Status.ONGOING, 'Status auto-transitioned from PENDING ➔ ONGOING upon assignment');

    // ----------------------------------------------------------------
    // SCENARIO 5: Officer 1 marks pothole FIXED
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 5: Officer 1 Status Transition (ONGOING ➔ FIXED)');
    const fixedPothole = await transitionPotholeStatus({
      potholeId: pothole1.id,
      newStatus: Status.FIXED,
      actorId: officer1.id,
      reason: 'Asphalt patching completed by Kalaburagi road team.',
    });
    assert(fixedPothole.status === Status.FIXED, 'Pothole marked FIXED by Officer 1');
    assert(fixedPothole.assignedOfficer?.email === officer1Email, 'Assigned officer email remains populated after FIXED transition');

    // ----------------------------------------------------------------
    // SCENARIO 6: Edge Case - Officer 1 tries to REOPEN a FIXED report
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 6: Edge Case - Officer attempts to reopen FIXED report');
    try {
      await transitionPotholeStatus({
        potholeId: pothole1.id,
        newStatus: Status.PENDING,
        actorId: officer1.id,
        reason: 'Attempting reopen as officer',
      });
      assert(false, 'Officer reopening FIXED report MUST fail');
    } catch (err: any) {
      assert(err.statusCode === 403 || err.message.includes('reopen'), 'Officer reopening FIXED report correctly rejected with 403 Forbidden');
    }

    // ----------------------------------------------------------------
    // SCENARIO 7: Kalaburagi Manager reopens FIXED report (Allowed)
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 7: Kalaburagi Manager Reopens FIXED Report (FIXED ➔ PENDING)');
    const reopenedPothole = await transitionPotholeStatus({
      potholeId: pothole1.id,
      newStatus: Status.PENDING,
      actorId: manager.id,
      reason: 'Citizen feedback indicates patch subsided after rain.',
    });
    assert(reopenedPothole.status === Status.PENDING, 'Pothole reopened to PENDING by Manager');

    // ----------------------------------------------------------------
    // SCENARIO 8: Data Table Reflection & Audit Trail
    // ----------------------------------------------------------------
    console.log('\n🔹 SCENARIO 8: Data Table Reflection & Audit Verification');
    const queue = await db.pothole.findMany({
      where: { municipalityId: kalaburagi.id },
      include: {
        assignedOfficer: { select: { id: true, name: true, email: true } },
        reportImage: true,
        votes: true,
        comments: true,
      }
    });

    const targetInQueue = queue.find(p => p.id === pothole1.id);
    assert(!!targetInQueue, 'Pothole reflected in Kalaburagi Queue Table');
    assert(targetInQueue?.assignedOfficer?.email === officer1Email, 'Officer 1 email reflected in Queue Table');
    assert(targetInQueue?.status === Status.PENDING, 'Reopened status PENDING reflected in Queue Table');

    const history = await db.reportStatusHistory.findMany({
      where: { potholeId: pothole1.id },
      orderBy: { createdAt: 'asc' }
    });
    assert(history.length >= 2, 'Complete Status History Trail generated in PostgreSQL');

    console.log('\n================================================================');
    console.log(`📊 ALL TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

runFullScenarioTests().then(() => process.exit(0)).catch(console.error);
