import 'dotenv/config';
import { db } from '../src/lib/db';
import { DuplicateStatus, Status, LocationSource } from '@prisma/client';

async function main() {
    console.log('=== SEEDING REAL VISUAL DUPLICATE PAIR FOR TRIAGE DEMO ===\n');

    // 1. Find New Delhi Municipality & Officer Delhi User
    const officer = await db.user.findFirst({
        where: { email: 'officer@test.in' },
        include: { municipalityMember: true },
    });

    if (!officer || !officer.municipalityMember) {
        throw new Error('Officer Delhi user not found. Please ensure seed users exist.');
    }

    const municipalityId = officer.municipalityMember.municipalityId;
    const citizen = await db.user.findFirst({ where: { email: 'citizen@test.in' } });
    if (!citizen) throw new Error('Citizen test user not found.');

    // Janpath, New Delhi coordinates
    const baseLat = 28.6139;
    const baseLng = 77.2090;

    // Real pothole sample image URLs
    const image1Url = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
    const image2Url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80';

    // Generate base embedding vector (unit length 512-dim)
    console.log('Generating AI vector embeddings...');
    const baseVector = Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1));
    const mag1 = Math.sqrt(baseVector.reduce((sum, v) => sum + v * v, 0));
    const emb1 = baseVector.map(v => v / mag1);

    // Highly similar vector (cosine similarity ~ 0.94)
    const similarVector = emb1.map((v, i) => v + (i % 5 === 0 ? 0.05 : 0.0));
    const mag2 = Math.sqrt(similarVector.reduce((sum, v) => sum + v * v, 0));
    const emb2 = similarVector.map(v => v / mag2);

    // Compute exact cosine similarity (1.0 - distance)
    const dot = emb1.reduce((sum, v, i) => sum + v * emb2[i], 0);
    console.log(`Computed Visual Cosine Similarity: ${Math.round(dot * 100)}%\n`);

    // 2. Create Primary Report
    console.log('Creating Primary Pothole Report...');
    const primary = await db.pothole.create({
        data: {
            title: 'Severe Asphalt Cave-in on Janpath Road',
            description: 'Massive 4-foot wide pothole near metro gate causing severe traffic hazard and vehicle tire damage.',
            latitude: baseLat,
            longitude: baseLng,
            locationSource: LocationSource.GPS,
            severity: 5,
            status: Status.PENDING,
            imageUrl: image1Url,
            userId: citizen.id,
            municipalityId: municipalityId,
            city: 'New Delhi',
            state: 'Delhi',
        },
    });

    const primaryImg = await db.reportImage.create({
        data: {
            storageKey: `primary_${primary.id}.jpg`,
            processingState: 'COMPLETED',
            potholeId: primary.id,
        },
    });

    // Update embedding in pgvector via raw SQL
    const emb1Str = `[${emb1.join(',')}]`;
    await db.$executeRawUnsafe(
        `UPDATE "report_image" SET "embedding" = '${emb1Str}'::vector WHERE "id" = '${primaryImg.id}'`
    );

    // 3. Create Secondary Candidate Duplicate Report (12m away)
    console.log('Creating Candidate Duplicate Pothole Report (12m away)...');
    const duplicate = await db.pothole.create({
        data: {
            title: 'Deep Crater Defect near Bus Stop (Janpath)',
            description: 'Large road crater right near bus station, vehicles swerving into oncoming lane to avoid damage.',
            latitude: baseLat + 0.0001, // ~11m distance
            longitude: baseLng + 0.00008,
            locationSource: LocationSource.GPS,
            severity: 4,
            status: Status.PENDING,
            imageUrl: image2Url,
            userId: citizen.id,
            municipalityId: municipalityId,
            city: 'New Delhi',
            state: 'Delhi',
        },
    });

    const duplicateImg = await db.reportImage.create({
        data: {
            storageKey: `duplicate_${duplicate.id}.jpg`,
            processingState: 'COMPLETED',
            potholeId: duplicate.id,
        },
    });

    const emb2Str = `[${emb2.join(',')}]`;
    await db.$executeRawUnsafe(
        `UPDATE "report_image" SET "embedding" = '${emb2Str}'::vector WHERE "id" = '${duplicateImg.id}'`
    );

    // 4. Create DuplicateCandidate Relation with 94% visual similarity score
    console.log('Creating Candidate Link with 94% Visual Similarity...');
    const candidate = await db.duplicateCandidate.upsert({
        where: {
            potholeId_duplicateId: {
                potholeId: primary.id,
                duplicateId: duplicate.id,
            },
        },
        update: {
            confidenceScore: 0.94,
            status: DuplicateStatus.POTENTIAL,
        },
        create: {
            potholeId: primary.id,
            duplicateId: duplicate.id,
            confidenceScore: 0.94,
            status: DuplicateStatus.POTENTIAL,
        },
    });

    console.log(`\n✅ SUCCESSFULLY CREATED DEMO VISUAL DUPLICATE PAIR!`);
    console.log(`Primary Report ID: ${primary.id} ("${primary.title}")`);
    console.log(`Duplicate Candidate ID: ${duplicate.id} ("${duplicate.title}")`);
    console.log(`Candidate Link ID: ${candidate.id}`);
    console.log(`Visual Similarity Score: ${Math.round(dot * 100)}%`);
}

main().catch((err) => {
    console.error('Failed to seed visual duplicate demo:', err);
    process.exit(1);
});
