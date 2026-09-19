import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, loginAs, CITIZEN_USER } from './e2e-helper';

test.describe('E2E Flow 2: Citizen Hazard Reporting & Form Validation', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
  });

  test('Form Validation - Attempt Submission with Invalid Short Input', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Map view
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('domcontentloaded');

    // 3. Trigger Report Modal
    const reportBtn = page.locator('button:has-text("Report Pothole"), button:has-text("Report")').first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // 4. Form elements
    const titleInput = page.locator('#report-title');
    const descInput = page.locator('#report-desc');
    const submitBtn = page.locator('form button[type="submit"]').first();

    await expect(titleInput).toBeVisible();

    // Attempt submission with empty fields
    await submitBtn.click();

    // Assert form is not submitted (modal dialog remains open and title input is visible)
    await expect(titleInput).toBeVisible();

    // Fill valid short inputs and check validation requirement
    await titleInput.fill('A');
    await descInput.fill('B');
    await submitBtn.click();
    await expect(titleInput).toBeVisible();
  });

  test('Complete Valid Hazard Report Submission', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Map view
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('domcontentloaded');

    // 3. Trigger Report Modal
    const reportBtn = page.locator('button:has-text("Report Pothole"), button:has-text("Report")').first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // 4. Fill out valid report details
    const titleInput = page.locator('#report-title');
    const descInput = page.locator('#report-desc');
    const submitBtn = page.locator('form button[type="submit"]').first();

    await expect(titleInput).toBeVisible();
    const timestamp = Date.now();
    await titleInput.fill(`Deep Crater Hazard ${timestamp}`);
    await descInput.fill(`Severe roadbed damage causing traffic obstruction near intersection ${timestamp}.`);

    // Select Medium / High severity
    const highSeverityBtn = page.locator('button:has-text("High")').first();
    if (await highSeverityBtn.isVisible()) {
      await highSeverityBtn.click();
    }

    // Submit report
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 5. Assert successful submission toast or modal dismissal
    const toastSuccess = page.locator('.sonner-toast:has-text("filed successfully"), [data-sonner-toast]:has-text("filed successfully"), .sonner-toast:has-text("successfully")').first();
    await expect(toastSuccess).toBeVisible({ timeout: 10000 });
  });

});
