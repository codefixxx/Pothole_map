import { runStateMachineUnitTests } from './unit/state-machine.test';
import { runRateLimitUnitTests } from './unit/rate-limit.test';
import { runValidationsUnitTests } from './unit/validations.test';
import { runAuditServiceIntegrationTests } from './integration/audit-service.test';
import { runHealthApiIntegrationTests } from './integration/health-api.test';
import { runRealtimeSseIntegrationTests } from './integration/realtime-sse.test';
import { runLoadSpikeStressTests } from './load/load-spike-test';

async function runMasterTestSuite() {
    console.log('================================================================');
    console.log('🚀 POTHOLEMAP PRODUCTION TESTING & HARDENING MASTER TEST SUITE 🚀');
    console.log('================================================================\n');

    let allPassed = true;

    // TIER 1: UNIT TESTS
    console.log('🔹 TIER 1: UNIT TESTS');
    const u1 = await runStateMachineUnitTests();
    const u2 = await runRateLimitUnitTests();
    const u3 = await runValidationsUnitTests();
    if (!u1 || !u2 || !u3) allPassed = false;
    console.log('');

    // TIER 2: INTEGRATION TESTS
    console.log('🔹 TIER 2: INTEGRATION TESTS');
    const i1 = await runAuditServiceIntegrationTests();
    const i2 = await runHealthApiIntegrationTests();
    const i3 = await runRealtimeSseIntegrationTests();
    if (!i1 || !i2 || !i3) allPassed = false;
    console.log('');

    // TIER 3: CONCURRENCY & LOAD SPIKE STRESS TESTS
    console.log('🔹 TIER 3: CONCURRENCY & LOAD SPIKE STRESS TESTS');
    const l1 = await runLoadSpikeStressTests();
    if (!l1) allPassed = false;
    console.log('');

    console.log('================================================================');
    if (allPassed) {
        console.log('🎉 ALL PRODUCTION TEST TIERS PASSED 100% CLEANLY! 🎉');
        console.log('================================================================');
        try {
            const { getRedisConnection } = await import('../src/lib/redis');
            getRedisConnection().disconnect();
        } catch {}
        process.exit(0);
    } else {
        console.error('❌ SOME TEST TIERS FAILED. PLEASE REVIEW LOGS ABOVE.');
        console.log('================================================================');
        process.exit(1);
    }
}

runMasterTestSuite().catch((err) => {
    console.error('Fatal Master Test Suite Error:', err);
    process.exit(1);
});
