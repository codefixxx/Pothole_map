import { runLoadSpikeStressTests } from './load/load-spike-test';
import { runCacheFailoverLoadTests } from './load/cache-failover-load.test';
import { runDbPoolLoadTests } from './load/db-pool-load.test';

async function testAllType3LoadTests() {
    console.log('================================================================');
    console.log('🧪 TYPE 3 LOAD & CONCURRENCY STRESS TESTS SUITE EXECUTION 🧪');
    console.log('================================================================\n');

    const results = await Promise.all([
        runLoadSpikeStressTests(),
        runCacheFailoverLoadTests(),
        runDbPoolLoadTests(),
    ]);

    const allPassed = results.every(Boolean);

    console.log('================================================================');
    if (allPassed) {
        console.log('🎉 ALL TYPE 3 LOAD & CONCURRENCY TESTS PASSED 100% CLEANLY! 🎉');
        console.log('================================================================');
        process.exit(0);
    } else {
        console.error('❌ TYPE 3 LOAD & CONCURRENCY TESTS FAILED.');
        process.exit(1);
    }
}

testAllType3LoadTests().catch(console.error);
