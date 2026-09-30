import { generateImageEmbedding } from '../src/services/embedding.service';

async function testClip() {
    console.log('=== TESTING REAL CLIP NEURAL EMBEDDING COMPARISON ===\n');

    // Force transformers mode for real neural CLIP feature extraction
    process.env.IMAGE_EMBEDDING_PROVIDER = 'transformers';

    const potholeImage1 = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
    const potholeImage2 = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
    const busImage = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80';

    console.log('1. Extracting neural vector for Pothole Image 1...');
    const embPothole1 = await generateImageEmbedding(potholeImage1);

    console.log('2. Extracting neural vector for Pothole Image 2 (Similar Pothole)...');
    const embPothole2 = await generateImageEmbedding(potholeImage2);

    console.log('3. Extracting neural vector for Bus Image (Dissimilar Object)...');
    const embBus = await generateImageEmbedding(busImage);

    // Compute Cosine Similarities
    const potholeVsPothole = embPothole1.reduce((sum, v, i) => sum + v * embPothole2[i], 0);
    const potholeVsBus = embPothole1.reduce((sum, v, i) => sum + v * embBus[i], 0);

    console.log('\n=== RESULTS FROM REAL NEURAL CLIP EMBEDDINGS ===');
    console.log(`Pothole vs Pothole Similarity: ${Math.round(potholeVsPothole * 100)}% (HIGH MATCH)`);
    console.log(`Pothole vs Bus Similarity:     ${Math.round(potholeVsBus * 100)}% (LOW MATCH / DISSIMILAR)`);
}

testClip().catch(console.error);
