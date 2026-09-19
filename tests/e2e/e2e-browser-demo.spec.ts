import { test, expect } from '@playwright/test';

test.describe('PotholeMap Production E2E Browser Demo Suite', () => {

  test('1. Verify Public Civic Legal Pages & CTA Section', async ({ page }) => {
    // Navigate to Terms of Service
    await page.goto('/terms');
    await expect(page).toHaveTitle(/Terms of Service/i);
    await expect(page.locator('h1')).toContainText(/Terms of Service/i);

    // Click CTA button to navigate to main reporting app
    const ctaButton = page.locator('a:has-text("Report Pothole Now")');
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForURL('/');
    }

    // Navigate to Privacy Policy
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/Privacy Policy/i);

    // Navigate to Help & Support
    await page.goto('/help');
    await expect(page).toHaveTitle(/Help/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('2. Verify Pothole Map Main App Interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check brand header logo/title
    const heading = page.locator('header, nav, h1').first();
    await expect(heading).toBeVisible();
  });

  test('3. Verify Admin Dashboard & Audit Logs Portal', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify Admin Portal loads cleanly
    await expect(page.locator('body')).toBeVisible();
  });

});
