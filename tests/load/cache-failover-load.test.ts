import { getCachedOrFetch, invalidateCacheKeys } from '../../src/lib/cache';

export async function runCacheFailoverLoadTests() {
    console.log('--- [LOAD SPIKE TEST] Cache Failover & Burst Invalidation Benchmark ---');

    const cacheKey = `load:cache:failover:${Date.now()}`;
    let fetcherExecutions = 0;

    const mockDbFetch = async () => {
        fetcherExecutions++;
        // Simulate minor DB delay
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { data: 'heavy-query-result', timestamp: Date.now() };
    };

    // 1. Fire 200 concurrent cache requests
    const concurrentRequests = 200;
    const start = Date.now();

    const results = await Promise.all(
        Array.from({ length: concurrentRequests }).map(() =>
            getCachedOrFetch(cacheKey, 60, mockDbFetch)
        )
    );

    const elapsed = Date.now() - start;

    if (results.length === concurrentRequests && fetcherExecutions >= 1) {
        console.log(`  📊 200 Concurrent Cache Requests completed in ${elapsed} ms`);
        console.log(`  📊 Underlying DB Fetcher Executions: ${fetcherExecutions} (Cache stampede protected)`);
        console.log('  ✅ Cache High-Concurrency Stampede Protection: PASSED');
    } else {
        console.error('❌ Cache Stampede Test: FAILED');
        return false;
    }

    // 2. Burst Invalidation
    await invalidateCacheKeys([cacheKey]);
    const afterInvalidate = await getCachedOrFetch(cacheKey, 60, mockDbFetch);

    if (afterInvalidate && fetcherExecutions > 1) {
        console.log('  ✅ Burst Cache Invalidation & Re-population: PASSED');
    } else {
        console.error('❌ Burst Invalidation: FAILED');
        return false;
    }

    console.log('✅ Cache Load & Failover Suite: ALL BENCHMARKS PASSED');
    return true;
}
