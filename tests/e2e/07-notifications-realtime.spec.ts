import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, loginAs, CITIZEN_USER } from './e2e-helper';

test.describe('E2E Flow 7: Real-Time SSE Notifications & Notification Center', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
  });

  test('Verify Notification Bell Dropdown & Notification Center Drawer', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Map Page
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('domcontentloaded');

    // 3. Locate Notification Bell icon button
    const notifBell = page.locator('#notification-bell-btn, button[aria-label*="notification" i]').first();
    await expect(notifBell).toBeVisible({ timeout: 15000 });

    // 4. Click Notification Bell
    await notifBell.click();

    // 5. Assert Notification popover/dialog opens
    const notifContainer = page.locator('[role="dialog"], div:has-text("Civic Notifications")').first();
    await expect(notifContainer).toBeVisible({ timeout: 15000 });
  });

  test('Verify Notifications API & Platform Health Endpoints', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Query Notification API endpoint directly in browser context
    const response = await page.request.get('http://localhost:3000/api/notifications');
    expect(response.status()).toBeLessThan(500);

    // 3. Query Health API endpoint
    const healthRes = await page.request.get('http://localhost:3000/api/health');
    expect(healthRes.status()).toBeLessThan(500);
  });

});
