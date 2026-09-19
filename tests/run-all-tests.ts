import { runStateMachineUnitTests } from './unit/state-machine.test';
import { runRateLimitUnitTests } from './unit/rate-limit.test';
import { runValidationsUnitTests } from './unit/validations.test';
import { runAuthHelpersUnitTests } from './unit/auth-helpers.test';
import { runMunicipalitySchemaUnitTests } from './unit/municipality-schema.test';
import { runUtilsUnitTests } from './unit/utils.test';
import { runMapConfigUnitTests } from './unit/map-config.test';

import { runAuditServiceIntegrationTests } from './integration/audit-service.test';
import { runHealthApiIntegrationTests } from './integration/health-api.test';
import { runRealtimeSseIntegrationTests } from './integration/realtime-sse.test';
import { runPotholeServiceIntegrationTests } from './integration/pothole-service.test';
import { runNotificationsIntegrationTests } from './integration/notifications.test';
import { runDuplicateDetectionIntegrationTests } from './integration/duplicate-detection.test';

import { runLoadSpikeStressTests } from './load/load-spike-test';
import { runCacheFailoverLoadTests } from './load/cache-failover-load.test';
import { runDbPoolLoadTests } from './load/db-pool-load.test';

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
    const u4 = await runAuthHelpersUnitTests();
    const u5 = await runMunicipalitySchemaUnitTests();
    const u6 = await runUtilsUnitTests();
    const u7 = await runMapConfigUnitTests();
    if (!u1 || !u2 || !u3 || !u4 || !u5 || !u6 || !u7) allPassed = false;
    console.log('');

    // TIER 2: INTEGRATION TESTS
    console.log('🔹 TIER 2: INTEGRATION TESTS');
    const i1 = await runAuditServiceIntegrationTests();
    const i2 = await runHealthApiIntegrationTests();
    const i3 = await runRealtimeSseIntegrationTests();
    const i4 = await runPotholeServiceIntegrationTests();
    const i5 = await runNotificationsIntegrationTests();
    const i6 = await runDuplicateDetectionIntegrationTests();
    if (!i1 || !i2 || !i3 || !i4 || !i5 || !i6) allPassed = false;
    console.log('');

    // TIER 3: CONCURRENCY & LOAD SPIKE STRESS TESTS
    console.log('🔹 TIER 3: CONCURRENCY & LOAD SPIKE STRESS TESTS');
    const l1 = await runLoadSpikeStressTests();
    const l2 = await runCacheFailoverLoadTests();
    const l3 = await runDbPoolLoadTests();
    if (!l1 || !l2 || !l3) allPassed = false;
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
