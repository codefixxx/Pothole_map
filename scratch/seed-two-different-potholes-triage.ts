import 'dotenv/config';
import { db } from '../src/lib/db';
import { generateImageEmbedding } from '../src/services/embedding.service';
import { DuplicateStatus, Status, LocationSource } from '@prisma/client';

async function seedTwoDifferentPotholes() {
    console.log('=== SEEDING TWO DIFFERENT POTHOLES WITH REAL CLIP AI EMBEDDINGS ===\n');

    process.env.IMAGE_EMBEDDING_PROVIDER = 'transformers';

    const officer = await db.user.findFirst({
        where: { email: 'officer@test.in' },
        include: { municipalityMember: true },
    });
    if (!officer || !officer.municipalityMember) throw new Error('Officer Delhi not found.');
    const citizen = await db.user.findFirst({ where: { email: 'citizen@test.in' } });
    if (!citizen) throw new Error('Citizen not found.');

    const municipalityId = officer.municipalityMember.municipalityId;
    const baseLat = 28.6139;
    const baseLng = 77.2090;

    // Two DIFFERENT pothole photos:
    // Photo 1: Asphalt surface crack
    const potholePhoto1 = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
    // Photo 2: Deep dirt/gravel road hole (COMPLETELY DIFFERENT)
    const potholePhoto2 = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80';

    console.log('1. Extracting CLIP neural vector for Pothole Photo 1 (Asphalt Crack)...');
    const emb1 = await generateImageEmbedding(potholePhoto1);

    console.log('2. Extracting CLIP neural vector for Pothole Photo 2 (Deep Dirt Hole)...');
    const emb2 = await generateImageEmbedding(potholePhoto2);

    // Compute exact Cosine Similarity
    const visualCosineSim = emb1.reduce((sum, v, i) => sum + v * emb2[i], 0);
    console.log(`\nComputed Real CLIP Visual Similarity: ${Math.round(visualCosineSim * 100)}%\n`);

    // Clean old Janpath demo potholes
    await db.duplicateCandidate.deleteMany({
        where: { pothole: { title: { contains: 'Janpath' } } },
    });
    await db.reportImage.deleteMany({
        where: { pothole: { title: { contains: 'Janpath' } } },
    });
    await db.pothole.deleteMany({
        where: { title: { contains: 'Janpath' } },
    });

    // Create Report 1 (Pothole 1 - Asphalt Crack)
    const pothole1 = await db.pothole.create({
        data: {
            title: 'Asphalt Surface Crack on Janpath Road',
            description: 'Shallow asphalt cracking near intersection.',
            latitude: baseLat,
            longitude: baseLng,
            severity: 3,
            status: Status.PENDING,
            imageUrl: potholePhoto1,
            userId: citizen.id,
            municipalityId: municipalityId,
            city: 'New Delhi',
        },
    });
    const img1 = await db.reportImage.create({
        data: {
            storageKey: `diff1_${pothole1.id}.jpg`,
            processingState: 'COMPLETED',
            potholeId: pothole1.id,
        },
    });
    await db.$executeRawUnsafe(
        `UPDATE "report_image" SET "embedding" = '[${emb1.join(',')}]'::vector WHERE "id" = '${img1.id}'`
    );

    // Create Report 2 (Pothole 2 - Deep Dirt Pit - 15m away)
    const pothole2 = await db.pothole.create({
        data: {
            title: 'Deep Gravel Pit B near Janpath Bus Stop',
            description: 'Deep unpaved gravel pit defect near curb.',
            latitude: baseLat + 0.00012, // ~13m distance
            longitude: baseLng + 0.00008,
            severity: 4,
            status: Status.PENDING,
            imageUrl: potholePhoto2,
            userId: citizen.id,
            municipalityId: municipalityId,
            city: 'New Delhi',
        },
    });
    const img2 = await db.reportImage.create({
        data: {
            storageKey: `diff2_${pothole2.id}.jpg`,
            processingState: 'COMPLETED',
            potholeId: pothole2.id,
        },
    });
    await db.$executeRawUnsafe(
        `UPDATE "report_image" SET "embedding" = '[${emb2.join(',')}]'::vector WHERE "id" = '${img2.id}'`
    );

    // Create Candidate link with REAL hybrid confidence score
    const distFactor = Math.max(0, 1.0 - 13 / 100); // ~0.87
    const confidenceScore = 0.3 * distFactor + 0.7 * visualCosineSim;

    const candidate = await db.duplicateCandidate.create({
        data: {
            potholeId: pothole1.id,
            duplicateId: pothole2.id,
            confidenceScore: Number(confidenceScore.toFixed(4)),
            status: DuplicateStatus.POTENTIAL,
        },
    });

    console.log('✅ CREATED TWO DIFFERENT POTHOLES PAIR WITH REAL CLIP AI EMBEDDINGS!');
    console.log(`Primary Report: "${pothole1.title}"`);
    console.log(`Candidate Report: "${pothole2.title}"`);
    console.log(`Real Visual Similarity: ${Math.round(visualCosineSim * 100)}%`);
    console.log(`Hybrid Confidence Score: ${Math.round(confidenceScore * 100)}%`);
}

seedTwoDifferentPotholes().catch(console.error);
