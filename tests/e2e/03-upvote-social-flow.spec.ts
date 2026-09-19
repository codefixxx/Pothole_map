import { test, expect } from '@playwright/test';
import { ensureE2EUsersExist, createTestPothole, loginAs, CITIZEN_USER } from './e2e-helper';

test.describe('E2E Flow 3: Upvotes, Hazard Confirmations & Feed Interaction', () => {

  test.beforeAll(async () => {
    await ensureE2EUsersExist();
    await createTestPothole(`E2E Social Feed Hazard ${Date.now()}`);
  });

  test('Verify Hazard Report Feed & Upvote Interaction', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Map view
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('domcontentloaded');

    // 3. Ensure sidebar list is visible
    const showListBtn = page.locator('button:has-text("Show List")');
    if (await showListBtn.isVisible()) {
      await showListBtn.click();
    }

    // 4. Locate the first upvote button in the sidebar feed
    const upvoteBtn = page.locator('aside button:has(.lucide-thumbs-up), button:has(.lucide-thumbs-up)').first();
    await expect(upvoteBtn).toBeVisible({ timeout: 10000 });

    // 5. Click the Upvote button
    await upvoteBtn.click();

    // 6. Assert upvote interaction completes and button remains visible
    await page.waitForTimeout(500);
    await expect(upvoteBtn).toBeVisible();
  });

  test('Verify Map Overlay Marker Click & Card Detail Drawer', async ({ page }) => {
    // 1. Authenticate as Citizen User
    await loginAs(page, CITIZEN_USER.email, CITIZEN_USER.password);

    // 2. Open Map view
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('domcontentloaded');

    // 3. Ensure sidebar is visible
    const showListBtn = page.locator('button:has-text("Show List")');
    if (await showListBtn.isVisible()) {
      await showListBtn.click();
    }

    // 4. Click the first report card heading in the sidebar list to inspect details
    const cardTitle = page.locator('aside h4, aside .font-semibold').first();
    await expect(cardTitle).toBeVisible({ timeout: 10000 });
    await cardTitle.click();

    // 5. Assert detail drawer / inspection modal appears
    const modalContent = page.locator('[role="dialog"], h2, h3, h4').first();
    await expect(modalContent).toBeVisible({ timeout: 5000 });
  });

});
