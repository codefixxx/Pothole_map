import { db } from '../../src/lib/db';
import { getOrCreateTestUser } from '../helpers/test-user';
import {
    createNotification,
    sendVerificationNotification,
    sendOngoingNotification,
    sendFixedNotification,
} from '../../src/services/notification.service';

export async function runNotificationsIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Notification Persistence & Transport Engine ---');

    const actor = await getOrCreateTestUser();

    // 1. Direct Database Notification Creation
    const testTitle = `Test Notification ${Date.now()}`;
    const testMessage = 'Your pothole report status has been updated to VERIFIED.';
    const testLink = 'http://localhost:3000/dashboard';

    const notif = await createNotification({
        userId: actor.id,
        title: testTitle,
        message: testMessage,
        link: testLink,
    });

    if (notif && notif.id && notif.title === testTitle) {
        console.log('  ✅ Real Database Notification Creation & Relation: PASSED');
    } else {
        console.error('❌ Notification Creation: FAILED');
        return false;
    }

    // 2. Query Notification Record & Read Status
    const fetched = await db.notification.findUnique({
        where: { id: notif.id },
    });

    if (fetched && fetched.userId === actor.id && fetched.read === false) {
        console.log('  ✅ Query Notification & Unread State Assertion: PASSED');
    } else {
        console.error('❌ Query Notification: FAILED', fetched);
        return false;
    }

    // 3. Test Business Dispatch Helper (sendVerificationNotification)
    const countBefore = await db.notification.count({ where: { userId: actor.id } });
    await sendVerificationNotification(actor.id, 'pothole-test-123');
    const countAfter = await db.notification.count({ where: { userId: actor.id } });

    if (countAfter > countBefore) {
        console.log('  ✅ Real Business Dispatch (sendVerificationNotification): PASSED');
    } else {
        console.error('❌ Business Notification Dispatch: FAILED');
        return false;
    }

    // 4. Test Notification Lifecycle Cleanup
    await db.notification.deleteMany({
        where: { userId: actor.id },
    });
    console.log('  ✅ Test Notification Cleanup: PASSED');

    console.log('✅ Notifications Integration Suite: ALL TESTS PASSED');
    return true;
}
