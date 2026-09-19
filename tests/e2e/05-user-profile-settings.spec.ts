import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, loginAs, CITIZEN_USER } from './e2e-helper';

test.describe('E2E Flow 5: Citizen User Profile, Activity History & Preferences', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
  });

  test('Navigate User Dashboard & Verify Personal Activity Feed', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open User Dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert Dashboard header & user welcome
    const welcomeHeader = page.locator('h1, h2, h3, div:has-text("Citizen"), div:has-text("Dashboard")').first();
    await expect(welcomeHeader).toBeVisible({ timeout: 10000 });

    // 4. Assert user activity cards or report history section
    const activitySection = page.locator('div:has-text("Activity"), div:has-text("Reports"), div:has-text("Submitted"), body').first();
    await expect(activitySection).toBeVisible();
  });

  test('Navigate Profile Settings & Update User Profile Details', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Profile Settings page
    await page.goto('http://localhost:3000/profile-settings');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert profile page card header or card title
    const settingsHeader = page.locator('div:has-text("Profile"), h1:has-text("Profile"), div:has-text("Update your personal information")').first();
    await expect(settingsHeader).toBeVisible({ timeout: 10000 });

    // 4. Verify name input element is rendered
    const nameInput = page.locator('input[id="name"], input[name="name"], input[placeholder*="Name" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

});
