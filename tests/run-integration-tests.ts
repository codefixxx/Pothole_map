import { runAuditServiceIntegrationTests } from './integration/audit-service.test';
import { runHealthApiIntegrationTests } from './integration/health-api.test';
import { runRealtimeSseIntegrationTests } from './integration/realtime-sse.test';
import { runPotholeServiceIntegrationTests } from './integration/pothole-service.test';
import { runNotificationsIntegrationTests } from './integration/notifications.test';

async function testAllType2IntegrationTests() {
    console.log('================================================================');
    console.log('🧪 TYPE 2 INTEGRATION TESTS SUITE EXECUTION 🧪');
    console.log('================================================================\n');

    const results = await Promise.all([
        runAuditServiceIntegrationTests(),
        runHealthApiIntegrationTests(),
        runRealtimeSseIntegrationTests(),
        runPotholeServiceIntegrationTests(),
        runNotificationsIntegrationTests(),
    ]);

    const allPassed = results.every(Boolean);

    console.log('================================================================');
    if (allPassed) {
        console.log('🎉 ALL TYPE 2 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉');
        console.log('================================================================');
        process.exit(0);
    } else {
        console.error('❌ TYPE 2 INTEGRATION TESTS FAILED.');
        process.exit(1);
    }
}

testAllType2IntegrationTests().catch(console.error);
