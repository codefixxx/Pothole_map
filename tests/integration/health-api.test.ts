import { GET as healthRoute } from '../../src/app/api/health/route';

export async function runHealthApiIntegrationTests() {
    console.log('--- [INTEGRATION TEST] System Health Check Endpoint ---');

    try {
        const response = await healthRoute();
        const data = await response.json();

        if (response.status === 200 && data.status === 'ok' && data.services?.database === 'healthy') {
            console.log('  ✅ GET /api/health Payload Contract & DB Health: PASSED');
            console.log('  ✅ Services Check (Database: healthy, Cache:', data.services?.cache, '): PASSED');
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
