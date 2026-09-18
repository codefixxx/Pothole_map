import { rateLimit } from '../../src/lib/rate-limit';

export async function runRateLimitUnitTests() {
    console.log('--- [UNIT TEST] Sliding Window Rate Limiter ---');

    const testId = `unit-test-ip-${Date.now()}`;

    // 1. Initial request under limit
    const res1 = await rateLimit(testId, 3, 5);
    if (res1.success && res1.remaining === 2) {
        console.log('  ✅ Initial request under limit: PASSED');
    } else {
        console.error('❌ Initial request under limit: FAILED', res1);
        return false;
    }

    // 2. Second request under limit
    const res2 = await rateLimit(testId, 3, 5);
    if (res2.success && res2.remaining === 1) {
        console.log('  ✅ Second request under limit: PASSED');
    } else {
        console.error('❌ Second request under limit: FAILED', res2);
        return false;
    }

    // 3. Third request reaching limit
    const res3 = await rateLimit(testId, 3, 5);
    if (res3.success && res3.remaining === 0) {
        console.log('  ✅ Third request reaching limit (N=3): PASSED');
    } else {
        console.error('❌ Third request reaching limit: FAILED', res3);
        return false;
    }

    // 4. Fourth request exceeding limit (should be blocked)
    const res4 = await rateLimit(testId, 3, 5);
    if (!res4.success && res4.remaining === 0) {
        console.log('  ✅ Fourth request exceeding limit (Blocked N=4): PASSED');
    } else {
        console.error('❌ Fourth request exceeding limit: FAILED', res4);
        return false;
    }

    console.log('✅ Rate Limit Unit Suite: ALL 4 TESTS PASSED');
    return true;
}
