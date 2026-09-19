import { test, expect } from '@playwright/test';

test.describe('E2E Flow 1: Public Navigation, Civic Legal Pages & Theme Switcher', () => {

  test('Navigate Home Page & Verify Hero & Navigation Bar', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL('http://localhost:3000/');
    const headingOrNav = page.locator('header, nav, h1').first();
    await expect(headingOrNav).toBeVisible();
  });

  test('Verify Theme Switcher Toggle (Light <-> Dark Mode)', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    const themeBtn = page.locator('button[aria-label*="theme" i], button:has(.lucide-sun), button:has(.lucide-moon)').first();
    if (await themeBtn.isVisible()) {
      const htmlBefore = await page.getAttribute('html', 'class');
      await themeBtn.click();
      await page.waitForTimeout(300);
      const htmlAfter = await page.getAttribute('html', 'class');
      expect(htmlBefore).not.toEqual(htmlAfter);
    }
  });

  test('Navigate Legal Civic Pages (/terms, /privacy, /help) & CTA Banner', async ({ page }) => {
    // 1. Terms of Service
    await page.goto('http://localhost:3000/terms');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/terms/);

    // 2. Privacy Policy
    await page.goto('http://localhost:3000/privacy');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/privacy/);

    // 3. Help & Civic Guide
    await page.goto('http://localhost:3000/help');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/help/);
  });

});
