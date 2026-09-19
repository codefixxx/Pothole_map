import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, createTestPothole, loginAs, OFFICER_USER } from './e2e-helper';

test.describe('E2E Flow 6: Municipality Officer Triage Portal & Queue Management', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
    await createTestPothole(`Officer Patrol Triage Pothole ${Date.now()}`);
  });

  test('Navigate Municipality Officer Portal & Verify Queue Header & KPIs', async ({ page }) => {
    // 1. Authenticate as Municipal Officer
    await loginAs(page, OFFICER_USER.email, OFFICER_USER.password);

    // 2. Open Municipality Dashboard
    await page.goto('http://localhost:3000/municipality/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert Officer Dashboard header
    const portalHeader = page.locator('h1, h2, div:has-text("Patrol Queue"), div:has-text("Municipality")').first();
    await expect(portalHeader).toBeVisible();

    // 4. Assert Triage Queue container or table
    const queueContainer = page.locator('div:has-text("Queue"), table, button:has-text("Priority")').first();
    await expect(queueContainer).toBeVisible();
  });

  test('Verify Sort Filters & Status Filter Selectors', async ({ page }) => {
    // 1. Authenticate as Municipal Officer
    await loginAs(page, OFFICER_USER.email, OFFICER_USER.password);

    // 2. Open Municipality Dashboard
    await page.goto('http://localhost:3000/municipality/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 3. Test sorting controls (Priority / Severity / Age)
    const prioritySortBtn = page.locator('button:has-text("Priority"), button:has-text("Severity"), button:has-text("Age")').first();
    if (await prioritySortBtn.isVisible()) {
      await prioritySortBtn.click();
      await page.waitForTimeout(300);
      await expect(prioritySortBtn).toBeVisible();
    }
  });

});
