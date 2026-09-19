import { runLoadSpikeStressTests } from './load-spike-test';
import { runCacheFailoverLoadTests } from './cache-failover-load.test';
import { runDbPoolLoadTests } from './db-pool-load.test';

async function main() {
    console.log('⚡ RUNNING LOAD & SPIKE STRESS TEST BENCHMARKS ⚡\n');
    const s1 = await runLoadSpikeStressTests();
    console.log('');
    const s2 = await runCacheFailoverLoadTests();
    console.log('');
    const s3 = await runDbPoolLoadTests();
    console.log('');

    if (s1 && s2 && s3) {
        console.log('🎉 ALL LOAD & SPIKE BENCHMARKS PASSED CLEANLY! 🎉');
        try {
            const { getRedisConnection } = await import('../../src/lib/redis');
            getRedisConnection().disconnect();
        } catch {}
        process.exit(0);
    } else {
        console.error('❌ LOAD TEST BENCHMARK FAILED.');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Load Test Runner Error:', err);
    process.exit(1);
});
