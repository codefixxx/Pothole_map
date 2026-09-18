import { rateLimit } from '../../src/lib/rate-limit';
import { getCachedOrFetch } from '../../src/lib/cache';

export async function runLoadSpikeStressTests() {
    console.log('--- [LOAD SPIKE TEST] High Concurrency Stress Benchmark (1,000 Requests) ---');

    const totalRequests = 1000;
    const concurrencyBatch = 50;
    const testKey = `load-test-${Date.now()}`;

    const startTime = Date.now();
    let successCount = 0;
    let rateLimitedCount = 0;
    let errorCount = 0;

    const dummyFetcher = async () => [{ id: 'load-pothole-1' }];

    // Simulate concurrent bursts of 50 requests in parallel up to 1,000 requests
    for (let i = 0; i < totalRequests; i += concurrencyBatch) {
        const batchPromises = Array.from({ length: concurrencyBatch }).map(async (_, idx) => {
            const reqIndex = i + idx;
            const ipIdentifier = `load-ip-${reqIndex % 20}`; // 20 distinct IP addresses

            try {
                // Check rate limiter & cache access under load
                const limitRes = await rateLimit(ipIdentifier, 30, 60);
                if (limitRes.success) {
                    await getCachedOrFetch(`potholes:cached:${reqIndex % 5}`, 10, dummyFetcher);
                    successCount++;
                } else {
                    rateLimitedCount++;
                }
            } catch (err) {
                errorCount++;
            }
        });

        await Promise.all(batchPromises);
    }

    const durationMs = Date.now() - startTime;
    const requestsPerSecond = Math.round((totalRequests / durationMs) * 1000);

    console.log(`  📊 Total Simulated Requests: ${totalRequests}`);
    console.log(`  📊 Duration: ${durationMs} ms`);
    console.log(`  📊 Throughput: ${requestsPerSecond} req/sec`);
    console.log(`  📊 Successful Requests Served: ${successCount}`);
    console.log(`  📊 Rate-Limited (429) Protected Requests: ${rateLimitedCount}`);
    console.log(`  📊 Error Count: ${errorCount}`);

    if (errorCount === 0 && (successCount + rateLimitedCount) === totalRequests) {
        console.log('  ✅ Concurrency Load Spike Benchmark: PASSED (0 System Errors under load)');
    } else {
        console.error('❌ Load Spike Benchmark: FAILED');
        return false;
    }

    console.log('✅ Load Spike Concurrency Suite: ALL BENCHMARKS PASSED');
    return true;
}
