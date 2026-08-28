import { db } from '@/src/lib/db';

let extractor: any = null;

/**
 * Generates a 512-dimensional image embedding vector.
 * If IMAGE_EMBEDDING_PROVIDER != 'transformers' or if model load fails,
 * it falls back to generating a mock unit-length vector.
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
    if (process.env.IMAGE_EMBEDDING_PROVIDER !== 'transformers') {
        // Return a mock 512-dimensional vector of unit length
        console.log('[Mock Embedding] Generating random 512-dimensional vector.');
        const mockVector = Array.from({ length: 512 }, () => Math.random() - 0.5);
        const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
        return mockVector.map(val => val / (magnitude || 1));
    }

    try {
        const { pipeline } = await import('@xenova/transformers');
        if (!extractor) {
            console.log('[Embedding Service] Loading Xenova/clip-vit-base-patch32 model...');
            // Note: By default, xenova/transformers stores downloaded models in a local cache directory (.cache)
            extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
        }

        console.log(`[Embedding Service] Extracting visual features from: ${imageUrl}`);
        const output = await extractor(imageUrl, { pooling: 'mean', normalize: true });
        
        // output.data is Float32Array
        const embedding = Array.from(output.data) as number[];
        return embedding;
    } catch (error) {
        console.error('[Embedding Service] Local embedding generation failed, falling back to mock:', error);
        const mockVector = Array.from({ length: 512 }, () => Math.random() - 0.5);
        const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
        return mockVector.map(val => val / (magnitude || 1));
    }
}
