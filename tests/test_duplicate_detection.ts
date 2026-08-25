import 'dotenv/config';
import { db } from '../src/lib/db';
import * as duplicateService from '../src/services/duplicate.service';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole } from '../src/services/pothole.service';
import { MunicipalityRole, Status, DuplicateStatus, LocationSource } from '@prisma/client';

async function main() {
    console.log('=== STARTING POTHOLE DUPLICATE DETECTION INTEGRATION TESTS ===\n');

    const citizenEmail = 'citizen.dup@pothole.in';
    const officerEmail = 'officer.dup@pothole.in';
    const managerEmail = 'manager.dup@pothole.in';
    const unaffiliatedEmail = 'unaffiliated.dup@pothole.in';
    const munName = 'Duplicate Test City';

    // Coordinates (Bangalore-ish)
    // 1 arcsecond is ~30 meters. So 0.0001 degrees is ~11 meters.
    const centerLat = 12.9716;
    const centerLng = 77.5946;

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: citizenEmail } } },
                { duplicate: { user: { email: citizenEmail } } }
            ]
        }
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officerEmail, managerEmail, unaffiliatedEmail] } },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Create users and municipality
    console.log('Step 2: Creating mock municipality, users, and members...');
    const municipality = await createMunicipality({ name: munName });

    const citizenUser = await db.user.create({
        data: { name: 'Dup Citizen', email: citizenEmail, emailVerified: true },
    });

    const officerUser = await db.user.create({
        data: { name: 'Dup Officer', email: officerEmail, emailVerified: true },
    });
    await addMunicipalityMember({
        userId: officerUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });

    const managerUser = await db.user.create({
        data: { name: 'Dup Manager', email: managerEmail, emailVerified: true },
    });
    await addMunicipalityMember({
        userId: managerUser.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.MANAGER,
    });

    const unaffiliatedUser = await db.user.create({
        data: { name: 'Unaffiliated Citizen', email: unaffiliatedEmail, emailVerified: true },
    });
    console.log('Mock users and municipality created.\n');

    // 3. Create test potholes
    console.log('Step 3: Creating test potholes at varying distances...');

    // A: Center Pothole (PENDING)
    const potholeA = await createPothole({
        title: 'Pothole A (Center)',
        description: 'Main pothole report at center coordinates.',
        latitude: centerLat,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    await db.pothole.update({
        where: { id: potholeA.id },
        data: { municipalityId: municipality.id }
    });

    // B: Close Duplicate (10m away, PENDING)
    const potholeB = await createPothole({
        title: 'Pothole B (10m away)',
        description: 'Close report, likely duplicate.',
        latitude: centerLat + 0.0001,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    await db.pothole.update({
        where: { id: potholeB.id },
        data: { municipalityId: municipality.id }
    });

    // C: Medium Duplicate (50m away, VERIFIED)
    const potholeC = await createPothole({
        title: 'Pothole C (50m away)',
        description: 'Medium distance duplicate.',
        latitude: centerLat + 0.0005,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 4,
        locationSource: LocationSource.GPS,
    });
    // Manually force status of C to VERIFIED
    await db.pothole.update({
        where: { id: potholeC.id },
        data: { status: Status.VERIFIED, municipalityId: municipality.id }
    });

    // D: Out of Range Pothole (220m away, PENDING)
    const potholeD = await createPothole({
        title: 'Pothole D (220m away)',
        description: 'Out of range report.',
        latitude: centerLat + 0.002,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });

    // E: Close but FIXED (15m away, FIXED)
    const potholeE = await createPothole({
        title: 'Pothole E (Fixed)',
        description: 'Fixed pothole nearby.',
        latitude: centerLat - 0.00015,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    await db.pothole.update({
        where: { id: potholeE.id },
        data: { status: Status.FIXED, fixedAt: new Date(), municipalityId: municipality.id }
    });

    // F: Close but REJECTED (20m away, REJECTED)
    const potholeF = await createPothole({
        title: 'Pothole F (Rejected)',
        description: 'Rejected pothole nearby.',
        latitude: centerLat - 0.0002,
        longitude: centerLng,
        userId: citizenUser.id,
        severity: 3,
        locationSource: LocationSource.GPS,
    });
    await db.pothole.update({
        where: { id: potholeF.id },
        data: { status: Status.REJECTED, municipalityId: municipality.id }
    });

    console.log('Test potholes created.\n');

    // 4. Test duplicate detection (pre-submission style)
    console.log('Step 4: Testing proximity duplicate detection from coordinates (radius = 100m)...');
    const detected = await duplicateService.detectNearbyDuplicates(centerLat, centerLng, 100);
    console.log(`Detected ${detected.length} potential duplicates nearby.`);
    
    // Check sizes and sorting
    // B (10m), C (50m), E (15m Fixed), F (20m Rejected) should be in radius. D (220m) should not.
    // Also A itself will be returned since we searched coordinates of center and did not exclude it.
    const foundIds = detected.map(d => d.id);
    if (!foundIds.includes(potholeB.id) || !foundIds.includes(potholeC.id)) {
        throw new Error('FAILED: Missing expected active duplicate potholes within radius.');
    }
    if (foundIds.includes(potholeD.id)) {
        throw new Error('FAILED: Found pothole out of range.');
    }

    // Verify confidence sorting: Active should be ranked first, higher distance should decay
    const activeB = detected.find(d => d.id === potholeB.id);
    const activeC = detected.find(d => d.id === potholeC.id);
    const fixedE = detected.find(d => d.id === potholeE.id);
    const rejectedF = detected.find(d => d.id === potholeF.id);

    console.log(`- Active B (10m) Confidence: ${activeB?.confidenceScore} (Expected: High)`);
    console.log(`- Active C (50m) Confidence: ${activeC?.confidenceScore} (Expected: Medium-High)`);
    console.log(`- Fixed E (15m) Confidence: ${fixedE?.confidenceScore} (Expected: Low)`);
    console.log(`- Rejected F (20m) Confidence: ${rejectedF?.confidenceScore} (Expected: 0)`);

    if (!activeB || !activeC || !fixedE || !rejectedF) {
        throw new Error('FAILED: Could not find candidate metrics.');
    }
    if (activeB.confidenceScore <= activeC.confidenceScore) {
        throw new Error('FAILED: Distance decay ranking failed. Closer report should have higher score.');
    }
    if (activeB.confidenceScore <= fixedE.confidenceScore) {
        throw new Error('FAILED: Status penalty failed. Active report should have higher score than Fixed.');
    }
    if (rejectedF.confidenceScore !== 0) {
        throw new Error('FAILED: Rejected report should have exactly 0 confidence score.');
    }
    console.log('  [OK] Proximity detection and scoring ranking correct.\n');

    // 5. Test duplicates for existing pothole (excluding itself)
    console.log('Step 5: Testing duplicate lookup for existing Report A (excluding itself)...');
    const existingPotholeDups = await duplicateService.findDuplicatesForExistingPothole(potholeA.id, 100);
    const existingIds = existingPotholeDups.map(d => d.id);
    
    if (existingIds.includes(potholeA.id)) {
        throw new Error('FAILED: Existing pothole should be excluded from its own duplicate candidates.');
    }
    if (!existingIds.includes(potholeB.id) || !existingIds.includes(potholeC.id)) {
        throw new Error('FAILED: Expected duplicates not found for existing pothole.');
    }
    console.log('  [OK] Existing pothole exclusion worked correctly.\n');

    // 6. Test storing duplicate candidates in DB
    console.log('Step 6: Storing duplicate candidates in DB for Report A...');
    const saved = await duplicateService.linkDuplicateCandidates(potholeA.id, 100, 0.1);
    console.log(`Stored ${saved.length} duplicate candidates in DB.`);

    const candidates = await db.duplicateCandidate.findMany({
        where: { potholeId: potholeA.id },
    });
    
    // Should save B and C. Fixed E is low confidence (~0.17 score), Rejected F is 0 so both should not be saved if threshold is high,
    // but at 0.1 threshold, B, C, and E might be saved. Let's verify we have at least B and C saved.
    const savedDupIds = candidates.map(c => c.duplicateId);
    if (!savedDupIds.includes(potholeB.id) || !savedDupIds.includes(potholeC.id)) {
        throw new Error('FAILED: B or C was not saved as a candidate in the DB.');
    }
    if (savedDupIds.includes(potholeF.id)) {
        throw new Error('FAILED: Rejected report was saved as a candidate despite 0 score.');
    }
    console.log('  [OK] Candidates successfully stored in database.\n');

    // 7. Test resolving duplicate candidate status
    console.log('Step 7: Testing duplicate resolution and permission restrictions...');
    const targetCandidate = candidates.find(c => c.duplicateId === potholeB.id);
    if (!targetCandidate) {
        throw new Error('FAILED: Could not find candidate for resolution test.');
    }

    // Citizen user resolving -> should fail
    try {
        await duplicateService.resolveDuplicateCandidate(targetCandidate.id, DuplicateStatus.CONFIRMED, citizenUser.id);
        throw new Error('FAILED: Citizen user was allowed to resolve duplicate candidate.');
    } catch (error) {
        const err = error as { statusCode?: number };
        if (err.statusCode !== 403) {
            throw error;
        }
        console.log('  [OK] Correctly blocked citizen from resolving duplicate.');
    }

    // Unaffiliated user resolving -> should fail
    try {
        await duplicateService.resolveDuplicateCandidate(targetCandidate.id, DuplicateStatus.CONFIRMED, unaffiliatedUser.id);
        throw new Error('FAILED: Unaffiliated user was allowed to resolve duplicate candidate.');
    } catch (error) {
        const err = error as { statusCode?: number };
        if (err.statusCode !== 403) {
            throw error;
        }
        console.log('  [OK] Correctly blocked unaffiliated user from resolving duplicate.');
    }

    // Officer resolving -> should succeed
    const resolved = await duplicateService.resolveDuplicateCandidate(
        targetCandidate.id,
        DuplicateStatus.CONFIRMED,
        officerUser.id
    );
    if (resolved.status !== DuplicateStatus.CONFIRMED) {
        throw new Error('FAILED: Candidate status was not updated to CONFIRMED.');
    }
    console.log('  [OK] Officer successfully confirmed duplicate candidate.');

    // 8. Cleanup
    console.log('\nStep 8: Cleaning up mock test records...');
    await db.duplicateCandidate.deleteMany({
        where: {
            OR: [
                { pothole: { user: { email: citizenEmail } } },
                { duplicate: { user: { email: citizenEmail } } }
            ]
        }
    });
    await db.reportStatusHistory.deleteMany({
        where: { pothole: { user: { email: citizenEmail } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: citizenEmail } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [citizenEmail, officerEmail, managerEmail, unaffiliatedEmail] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.');

    console.log('\n=== ALL POTHOLE DUPLICATE DETECTION TESTS PASSED SUCCESSFULLY ===');
}

main().catch((error) => {
    console.error('Test run failed with error:', error);
    process.exit(1);
});
