import { Page, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { auth } from '../../src/lib/auth';

export const CITIZEN_USER = {
  email: 'citizen.e2e@gmail.com',
  password: 'password123',
  name: 'E2E Citizen Tester'
};

export const ADMIN_USER = {
  email: 'admin.e2e@gmail.com',
  password: 'password123',
  name: 'E2E Admin Officer'
};

export async function ensureE2EUsersExist() {
  try {
    let existingCitizen = await db.user.findUnique({ where: { email: CITIZEN_USER.email } });
    if (!existingCitizen) {
      await auth.api.signUpEmail({
        body: {
          email: CITIZEN_USER.email,
          password: CITIZEN_USER.password,
          name: CITIZEN_USER.name,
        }
      });
      await db.user.update({
        where: { email: CITIZEN_USER.email },
        data: { emailVerified: true }
      });
    }

    let existingAdmin = await db.user.findUnique({ where: { email: ADMIN_USER.email } });
    if (!existingAdmin) {
      await auth.api.signUpEmail({
        body: {
          email: ADMIN_USER.email,
          password: ADMIN_USER.password,
          name: ADMIN_USER.name,
        }
      });
      await db.user.update({
        where: { email: ADMIN_USER.email },
        data: { role: 'ADMIN', emailVerified: true }
      });
    }
  } catch (err) {
    console.error('Error ensuring E2E users exist:', err);
  }
}

export async function createTestPothole(title: string) {
  await ensureE2EUsersExist();
  const citizen = await db.user.findUnique({ where: { email: CITIZEN_USER.email } });
  if (!citizen) throw new Error('Citizen user not found');

  return await db.pothole.create({
    data: {
      title,
      description: 'E2E test pothole description for social & upvote verification.',
      latitude: 12.9716,
      longitude: 77.5946,
      severity: 6,
      status: 'PENDING',
      userId: citizen.id,
    }
  });
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForLoadState('domcontentloaded');

  if (!page.url().includes('/auth/login')) {
    return;
  }

  const emailInput = page.locator('input[name="email"]');
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    const passwordInput = page.locator('input[name="password"]');
    const submitBtn = page.locator('button[type="submit"]:has-text("Login")');
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitBtn.click();
    await page.waitForURL((url) => !url.href.includes('/auth/login'), { timeout: 10000 }).catch(() => {});
  }
}
