import { test, expect } from '@playwright/test';

test.describe('E2E Flow 1: Public Navigation, Civic Legal Pages & Theme Switcher', () => {

  test('Navigate Home Page & Verify Hero & Navigation Elements', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL('http://localhost:3000/');

    // Assert main brand & navigation elements are visible
    const navLogo = page.locator('a:has-text("PotholeMap"), header').first();
    await expect(navLogo).toBeVisible();

    // Assert main hero heading
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
  });

  test('Verify Theme Switcher Toggle (Light <-> Dark Mode)', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    const themeBtn = page.locator('button[aria-label*="theme" i], button:has(.lucide-sun), button:has(.lucide-moon)').first();
    await expect(themeBtn).toBeVisible();

    const htmlBefore = await page.getAttribute('html', 'class');
    await themeBtn.click();
    await page.waitForTimeout(300);
    const htmlAfter = await page.getAttribute('html', 'class');

    // Assert theme class actually toggled
    expect(htmlBefore).not.toEqual(htmlAfter);
  });

  test('Navigate Legal Civic Pages (/terms, /privacy, /help)', async ({ page }) => {
    // 1. Terms of Service
    await page.goto('http://localhost:3000/terms');
    await expect(page).toHaveURL(/terms/);
    await expect(page.locator('h1:has-text("Terms")').first()).toBeVisible();

    // 2. Privacy Policy
    await page.goto('http://localhost:3000/privacy');
    await expect(page).toHaveURL(/privacy/);
    await expect(page.locator('h1:has-text("Privacy")').first()).toBeVisible();

    // 3. Help & Civic Guide
    await page.goto('http://localhost:3000/help');
    await expect(page).toHaveURL(/help/);
    await expect(page.locator('h1:has-text("Help")').first()).toBeVisible();
  });

});
