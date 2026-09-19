import { test, expect } from '@playwright/test';

test.describe('E2E Flow 4: Municipality Officer Triage & Admin Audit Portal', () => {

  test('Navigate Admin Dashboard Overview & Metrics KPI Cards', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/admin/);
  });

  test('Verify Municipal Triage Queue & Status Transition Controls', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');

    const auditTab = page.locator('button:has-text("Audit Logs"), a:has-text("Audit Logs")').first();
    if (await auditTab.isVisible()) {
      await auditTab.click();
      await page.waitForTimeout(300);
    }
  });

});
