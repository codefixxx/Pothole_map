import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, loginAs, ADMIN_USER } from './e2e-helper';

test.describe('E2E Flow 4: Municipality Officer Triage & Admin Audit Portal', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
  });

  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Navigate Admin Dashboard Overview & Metrics KPI Cards', async ({ page }) => {
    // 1. Authenticate as Admin User
    await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);

    // 2. Navigate to Admin Portal
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert Admin Portal Header
    const adminHeading = page.locator('h1:has-text("Super Admin Portal"), h1:has-text("Admin")').first();
    await expect(adminHeading).toBeVisible({ timeout: 15000 });

    // 4. Assert KPI Cards section is rendered
    const kpiCards = page.locator('div:has-text("System Overview"), div:has-text("Total Potholes"), div:has-text("Municipalities")').first();
    await expect(kpiCards).toBeVisible({ timeout: 10000 });
  });

  test('Complete Super Admin Workflow Across Dashboard Management Tabs', async ({ page }) => {
    // 1. Authenticate as Admin User
    await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);

    // 2. Navigate to Admin Portal
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Municipalities Tab
    const muniTab = page.locator('button:has-text("Municipalities"), [role="tab"]:has-text("Municipalities")').first();
    await expect(muniTab).toBeVisible({ timeout: 15000 });
    await muniTab.click();

    const addMuniBtn = page.locator('button:has-text("Add Municipality")').first();
    await expect(addMuniBtn).toBeVisible({ timeout: 10000 });

    // 4. Staff Roster Tab
    const staffTab = page.locator('button:has-text("Staff Roster"), [role="tab"]:has-text("Staff Roster")').first();
    await expect(staffTab).toBeVisible({ timeout: 10000 });
    await staffTab.click();

    const staffHeader = page.locator('div:has-text("Staff"), div:has-text("Roster"), table, button:has-text("Assign Member")').first();
    await expect(staffHeader).toBeVisible({ timeout: 10000 });

    // 5. Jurisdictions Tab
    const jurTab = page.locator('button:has-text("Jurisdictions"), [role="tab"]:has-text("Jurisdictions")').first();
    await expect(jurTab).toBeVisible({ timeout: 10000 });
    await jurTab.click();

    // 6. Audit Logs Tab
    const auditTab = page.locator('button:has-text("Audit Logs"), [role="tab"]:has-text("Audit Logs")').first();
    await expect(auditTab).toBeVisible({ timeout: 10000 });
    await auditTab.click();

    const auditContent = page.locator('h3:has-text("System Audit Logs"), div:has-text("System Audit Logs"), table').first();
    await expect(auditContent).toBeVisible({ timeout: 10000 });
  });

});
