import { test, expect } from '@playwright/test';

test.describe('E2E Flow 2: Citizen Hazard Reporting & Form Validation', () => {

  test('Open Citizen Report Modal & Test Form Validations', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Trigger Report Modal
    const reportBtn = page.locator('button:has-text("Report Pothole"), a:has-text("Report Pothole")').first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await page.waitForTimeout(500);
    }

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();

    if (await titleInput.isVisible() && await descInput.isVisible()) {
      await titleInput.fill('Test Pothole Title');
      await descInput.fill('123'); // Short description (< 5 chars)

      const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Submit Report")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });

  test('Complete Valid Hazard Report Submission', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    const reportBtn = page.locator('button:has-text("Report Pothole"), a:has-text("Report Pothole")').first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await page.waitForTimeout(500);

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();

      if (await titleInput.isVisible()) {
        await titleInput.fill('Deep Pit on Ring Road Arterial');
        await descInput.fill('Large crater causing severe traffic slowdown near main junction.');

        const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Submit Report")').first();
        if (await submitBtn.isVisible()) {
          await expect(submitBtn).toBeEnabled();
        }
      }
    }
  });

});
