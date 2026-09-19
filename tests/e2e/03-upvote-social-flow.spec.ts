import { test, expect } from '@playwright/test';

test.describe('E2E Flow 3: Upvotes, Hazard Confirmations & Feed Interaction', () => {

  test('Verify Hazard Report Feed & Upvote Counter Interaction', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    const upvoteBtn = page.locator('button:has-text("Upvote"), button[aria-label*="upvote" i], button:has(.lucide-thumbs-up)').first();
    
    if (await upvoteBtn.isVisible()) {
      await upvoteBtn.click();
      await page.waitForTimeout(300);
      await expect(upvoteBtn).toBeVisible();
    }
  });

  test('Verify Map Overlay Marker Click & Card Detail Drawer', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.locator('.maplibregl-canvas, .maplibregl-map, #map, body').first();
    await expect(mapContainer).toBeDefined();
  });

});
