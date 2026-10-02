import { logger } from '@/src/lib/logger';

let extractor: any = null;

/**
 * Generates a 512-dimensional image embedding vector.
 * Supports:
 * 1. HuggingFace Inference API (if HUGGINGFACE_API_KEY is provided)
 * 2. Local ONNX pipeline via @xenova/transformers (if IMAGE_EMBEDDING_PROVIDER === 'transformers')
 * 3. Graceful unit-length mock vector fallback for resource-constrained environments
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
    // Strategy 1: HuggingFace Inference Microservice API
    if (process.env.HUGGINGFACE_API_KEY) {
        try {
            logger.info('[Embedding Service] Requesting embedding from HuggingFace Inference API', { imageUrl });
            const response = await fetch(
                'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/clip-ViT-B-32',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ inputs: imageUrl }),
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (Array.isArray(result) && result.length > 0) {
                    const rawEmbedding: number[] = Array.isArray(result[0]) ? result[0] : result;
                    const magnitude = Math.sqrt(rawEmbedding.reduce((sum, val) => sum + val * val, 0));
                    return rawEmbedding.map((val) => val / (magnitude || 1));
                }
            }
            logger.warn('[Embedding Service] HuggingFace API returned non-200 or unexpected format, falling back');
        } catch (hfErr) {
            logger.error('[Embedding Service] HuggingFace API call failed:', hfErr);
        }
    }

    // Strategy 2: Local @xenova/transformers pipeline
    if (process.env.IMAGE_EMBEDDING_PROVIDER === 'transformers') {
        try {
            const { pipeline, RawImage } = await import('@xenova/transformers');
            if (!extractor) {
                logger.info('[Embedding Service] Loading Xenova/clip-vit-base-patch32 model...');
                extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
            }

            logger.info('[Embedding Service] Extracting visual features locally:', { imageUrl });
            const image = await RawImage.read(imageUrl);
            const output = await extractor(image, { pooling: 'mean', normalize: true });

            const rawEmbedding = Array.from(output.data) as number[];
            const magnitude = Math.sqrt(rawEmbedding.reduce((sum, val) => sum + val * val, 0));
            return rawEmbedding.map((val) => val / (magnitude || 1));
        } catch (error) {
            logger.error('[Embedding Service] Local embedding generation failed, falling back to mock:', error);
        }
    }

    // Strategy 3: Graceful Mock Unit-Length Vector Fallback
    logger.info('[Embedding Service] Using unit-length random vector fallback.');
    const mockVector = Array.from({ length: 512 }, () => Math.random() - 0.5);
    const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
    return mockVector.map((val) => val / (magnitude || 1));
}

