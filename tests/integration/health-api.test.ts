import { GET as healthRoute } from '../../src/app/api/health/route';

export async function runHealthApiIntegrationTests() {
    console.log('--- [INTEGRATION TEST] System Health Check Endpoint ---');

    try {
        const response = await healthRoute();
        const data = await response.json();

        if (
            response.status === 200 &&
            (data.status === 'healthy' || data.status === 'degraded') &&
            data.services?.database?.status === 'up'
        ) {
            console.log('  ✅ GET /api/health Payload Contract & DB Health: PASSED');
            console.log('  ✅ Services Check (Database: up, Cache Queue:', data.services?.redisQueue?.status, '): PASSED');
        } else {
            console.error('❌ GET /api/health: FAILED', { status: response.status, data });
            return false;
        }
    } catch (err) {
        console.error('❌ Health API Integration Test: FAILED', err);
        return false;
    }

    console.log('✅ Health API Integration Suite: ALL TESTS PASSED');
    return true;
}
