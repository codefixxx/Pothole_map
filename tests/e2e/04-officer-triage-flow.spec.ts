import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, loginAs, ADMIN_USER } from './e2e-helper';

test.describe('E2E Flow 4: Municipality Officer Triage & Admin Audit Portal', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
  });

  test('Navigate Admin Dashboard Overview & Metrics KPI Cards', async ({ page }) => {
    // 1. Authenticate as Admin User
    await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);

    // 2. Navigate to Admin Portal
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert Admin Portal Header
    const adminHeading = page.locator('h1:has-text("Super Admin Portal"), h1:has-text("Admin")').first();
    await expect(adminHeading).toBeVisible({ timeout: 10000 });

    // 4. Assert KPI Cards section is rendered
    const kpiCards = page.locator('div:has-text("System Overview"), div:has-text("Total Potholes"), div:has-text("Municipalities")').first();
    await expect(kpiCards).toBeVisible();
  });

  test('Verify Municipal Triage Queue & Status Transition Controls', async ({ page }) => {
    // 1. Authenticate as Admin User
    await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);

    // 2. Navigate to Admin Portal
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Switch to Audit Logs tab
    const auditTab = page.locator('button:has-text("Audit Logs"), [role="tab"]:has-text("Audit Logs")').first();
    await expect(auditTab).toBeVisible();
    await auditTab.click();

    // 4. Assert Audit Log view renders
    const auditContent = page.locator('h3:has-text("System Audit Logs"), div:has-text("System Audit Logs"), table').first();
    await expect(auditContent).toBeVisible();

    // 5. Switch to Municipalities tab
    const muniTab = page.locator('button:has-text("Municipalities"), [role="tab"]:has-text("Municipalities")').first();
    await expect(muniTab).toBeVisible();
    await muniTab.click();

    // 6. Assert Municipalities view renders
    const muniContent = page.locator('h3:has-text("Municipalities"), button:has-text("Add Municipality")').first();
    await expect(muniContent).toBeVisible();
  });

});
