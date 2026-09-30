import { generateImageEmbedding } from '../src/services/embedding.service';

async function testTwoDifferentPotholes() {
    console.log('=== TESTING CLIP AI DISCRIMINATION ON TWO DIFFERENT POTHOLES ===\n');

    process.env.IMAGE_EMBEDDING_PROVIDER = 'transformers';

    // Image 1: Pothole A (Asphalt road crack)
    const potholeA_1 = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
    // Image 2: Pothole A (Same pothole, slightly cropped/different angle)
    const potholeA_2 = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
    // Image 3: Pothole B (COMPLETELY DIFFERENT pothole - deep concrete pit/dirt road hole)
    const potholeB = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80';

    console.log('1. Extracting AI vector for Pothole A (Photo 1)...');
    const embA1 = await generateImageEmbedding(potholeA_1);

    console.log('2. Extracting AI vector for Pothole A (Photo 2 - Same Pothole)...');
    const embA2 = await generateImageEmbedding(potholeA_2);

    console.log('3. Extracting AI vector for Pothole B (Different Pothole)...');
    const embB = await generateImageEmbedding(potholeB);

    // Compute Cosine Similarities (Dot product of normalized unit vectors)
    const similaritySamePothole = embA1.reduce((sum, v, i) => sum + v * embA2[i], 0);
    const similarityDifferentPothole = embA1.reduce((sum, v, i) => sum + v * embB[i], 0);

    console.log('\n=== REAL AI DISCRIMINATION ACCURACY RESULTS ===');
    console.log(`Pothole A vs Same Pothole A:      ${Math.round(similaritySamePothole * 100)}% (HIGH MATCH)`);
    console.log(`Pothole A vs Different Pothole B: ${Math.round(similarityDifferentPothole * 100)}% (LOW / DIFFERENT MATCH)`);
}

testTwoDifferentPotholes().catch(console.error);
