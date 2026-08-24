import 'dotenv/config';
import { db } from './src/lib/db';
import { createMunicipality, addMunicipalityMember } from './src/services/municipality.service';
import * as jurisdictionRepo from './src/repositories/jurisdiction.repository';
import * as potholeService from './src/services/pothole.service';
import { MunicipalityRole, Status } from '@prisma/client';

async function main() {
    console.log('=== STARTING MUNICIPALITY DASHBOARD INTEGRATION TESTS ===\n');

    const testEmailOfficer = 'officer.dash@pothole.in';
    const testEmailCitizen = 'citizen.dash@pothole.in';
    const targetMunName = 'Test Dashboard City';

    // 1. Clean up old test data
    console.log('Step 1: Cleaning up existing test records...');
    await db.vote.deleteMany({
        where: { user: { email: { in: [testEmailOfficer, testEmailCitizen] } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: testEmailCitizen } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: testEmailOfficer } },
    });
    await db.user.deleteMany({
        where: { email: { in: [testEmailOfficer, testEmailCitizen] } },
    });

    const oldMun = await db.municipality.findUnique({
        where: { name: targetMunName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }

    const otherMunName = 'Test Other City';
    const otherMun = await db.municipality.findUnique({
        where: { name: otherMunName },
    });
    if (otherMun) {
        await db.municipality.delete({ where: { id: otherMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Setup mock data
    console.log('Step 2: Creating municipalities and users...');
    const targetMunInstance = await createMunicipality({ name: targetMunName });
    const otherMunInstance = await createMunicipality({ name: otherMunName });

    // Create a jurisdiction boundary for target municipality
    // A simple polygon square
    const boundary = [
        [
            [77.0, 12.0],
            [78.0, 12.0],
            [78.0, 13.0],
            [77.0, 13.0],
            [77.0, 12.0],
        ]
    ];
    await jurisdictionRepo.create({
        name: `${targetMunName} Jurisdiction`,
        boundary,
        municipalityId: targetMunInstance.id,
    });

    // Create users
    const officerUser = await db.user.create({
        data: {
            name: 'Officer User',
            email: testEmailOfficer,
        },
    });
    await addMunicipalityMember({
        userId: officerUser.id,
        municipalityId: targetMunInstance.id,
        role: MunicipalityRole.OFFICER,
    });

    const citizenUser = await db.user.create({
        data: {
            name: 'Citizen Reporter',
            email: testEmailCitizen,
        },
    });

    console.log('Step 3: Creating mock potholes with varying severity, age, and votes...');
    // Create Potholes with deterministic timestamps
    const now = new Date();
    
    // Pothole A: Severity 8, created 3 days ago, votes will be added later
    const dateA = new Date(now);
    dateA.setDate(now.getDate() - 3);
    const potholeA = await db.pothole.create({
        data: {
            title: 'Large Pothole A',
            description: 'Major hazard on main road',
            severity: 8,
            latitude: 12.5,
            longitude: 77.5,
            userId: citizenUser.id,
            municipalityId: targetMunInstance.id,
            createdAt: dateA,
            updatedAt: dateA,
        },
    });

    // Pothole B: Severity 3, created 1 day ago, 0 votes
    const dateB = new Date(now);
    dateB.setDate(now.getDate() - 1);
    const potholeB = await db.pothole.create({
        data: {
            title: 'Minor Pothole B',
            description: 'Small crack in service lane',
            severity: 3,
            latitude: 12.6,
            longitude: 77.6,
            userId: citizenUser.id,
            municipalityId: targetMunInstance.id,
            createdAt: dateB,
            updatedAt: dateB,
        },
    });

    // Pothole C: Severity 8, created 5 days ago (older), 0 votes
    const dateC = new Date(now);
    dateC.setDate(now.getDate() - 5);
    const potholeC = await db.pothole.create({
        data: {
            title: 'Large Pothole C',
            description: 'Deep pothole on highway',
            severity: 8,
            latitude: 12.7,
            longitude: 77.7,
            userId: citizenUser.id,
            municipalityId: targetMunInstance.id,
            createdAt: dateC,
            updatedAt: dateC,
        },
    });

    // Pothole D (Outside): Assigned to other municipality
    const potholeD = await db.pothole.create({
        data: {
            title: 'Other Pothole D',
            description: 'In a different jurisdiction',
            severity: 9,
            latitude: 15.0,
            longitude: 75.0,
            userId: citizenUser.id,
            municipalityId: otherMunInstance.id,
            createdAt: now,
        },
    });

    // Add votes (confirmations) to Pothole A
    await db.vote.create({
        data: {
            potholeId: potholeA.id,
            userId: citizenUser.id,
        },
    });
    // Add vote from officer to A
    await db.vote.create({
        data: {
            potholeId: potholeA.id,
            userId: officerUser.id,
        },
    });

    console.log('Mock potholes setup completed.\n');

    // 4. Test Repository Jurisdiction helper
    console.log('Step 4: Testing jurisdictionRepo.findByMunicipalityId...');
    const targetJur = await jurisdictionRepo.findByMunicipalityId(targetMunInstance.id);
    if (!targetJur || targetJur.boundary.length === 0) {
        throw new Error('Failed to retrieve boundary for target municipality');
    }
    console.log('  [OK] Jurisdiction boundary fetched successfully.');
    console.log(`  Boundary point count: ${targetJur.boundary[0].length}\n`);

    // 5. Test Dashboard Queue Query & Sorting
    console.log('Step 5: Testing getMunicipalityDashboardQueue sorting & filtering...');

    // A. Priority Sort (Default)
    // Expect: Severity 8 first. Between A & C (both 8), A has 2 votes vs C has 0, so A first. Then C, then B.
    // Order: A (ID) -> C (ID) -> B (ID)
    console.log('Testing Sort: priority (default)...');
    const priorityQueue = await potholeService.getMunicipalityDashboardQueue({
        municipalityId: targetMunInstance.id,
        sortBy: 'priority',
    });

    console.log(`  Found ${priorityQueue.length} potholes in queue (Expected: 3, excludes outside Pothole D)`);
    if (priorityQueue.length !== 3) {
        throw new Error(`Queue length expected 3, got ${priorityQueue.length}`);
    }

    console.log('  Queue Order:');
    priorityQueue.forEach((p, idx) => console.log(`    ${idx + 1}. ${p.title} (Severity: ${p.severity}, Votes: ${p.votes.length}, Created: ${p.createdAt.toISOString()})`));

    if (priorityQueue[0].id === potholeA.id && priorityQueue[1].id === potholeC.id && priorityQueue[2].id === potholeB.id) {
        console.log('  [OK] Priority sort order correct (A -> C -> B)!\n');
    } else {
        throw new Error('Priority sort order incorrect!');
    }

    // B. Severity Sort
    // Expect: Severity 8 first. Between A & C (both 8), sorted by age (createdAt ASC: oldest first).
    // C was created 5 days ago (oldest), A was created 3 days ago. So C first, then A, then B.
    // Order: C -> A -> B
    console.log('Testing Sort: severity...');
    const severityQueue = await potholeService.getMunicipalityDashboardQueue({
        municipalityId: targetMunInstance.id,
        sortBy: 'severity',
    });

    console.log('  Queue Order:');
    severityQueue.forEach((p, idx) => console.log(`    ${idx + 1}. ${p.title} (Severity: ${p.severity}, Created: ${p.createdAt.toISOString()})`));

    if (severityQueue[0].id === potholeC.id && severityQueue[1].id === potholeA.id && severityQueue[2].id === potholeB.id) {
        console.log('  [OK] Severity sort order correct (C -> A -> B)!\n');
    } else {
        throw new Error('Severity sort order incorrect!');
    }

    // C. Age Sort
    // Expect: Oldest first (createdAt ASC).
    // Order: C (5 days ago) -> A (3 days ago) -> B (1 day ago)
    console.log('Testing Sort: age...');
    const ageQueue = await potholeService.getMunicipalityDashboardQueue({
        municipalityId: targetMunInstance.id,
        sortBy: 'age',
    });

    console.log('  Queue Order:');
    ageQueue.forEach((p, idx) => console.log(`    ${idx + 1}. ${p.title} (Created: ${p.createdAt.toISOString()})`));

    if (ageQueue[0].id === potholeC.id && ageQueue[1].id === potholeA.id && ageQueue[2].id === potholeB.id) {
        console.log('  [OK] Age sort order correct (C -> A -> B)!\n');
    } else {
        throw new Error('Age sort order incorrect!');
    }

    // 6. Clean up database records
    console.log('Step 6: Cleaning up mock test records...');
    await db.vote.deleteMany({
        where: { potholeId: { in: [potholeA.id, potholeB.id, potholeC.id, potholeD.id] } },
    });
    await db.pothole.deleteMany({
        where: { id: { in: [potholeA.id, potholeB.id, potholeC.id, potholeD.id] } },
    });
    await db.municipalityMember.deleteMany({
        where: { userId: officerUser.id },
    });
    await db.user.deleteMany({
        where: { id: { in: [officerUser.id, citizenUser.id] } },
    });
    await db.municipality.delete({ where: { id: targetMunInstance.id } });
    await db.municipality.delete({ where: { id: otherMunInstance.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL MUNICIPALITY DASHBOARD TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
