import { Page, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { auth } from '../../src/lib/auth';
import { MunicipalityRole } from '@prisma/client';

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

export const OFFICER_USER = {
  email: 'officer.e2e@gmail.com',
  password: 'password123',
  name: 'E2E Municipal Officer'
};

export async function ensureE2EUsersExist() {
  try {
    // 1. Citizen User
    let citizen = await db.user.findUnique({ where: { email: CITIZEN_USER.email } });
    if (!citizen) {
      await auth.api.signUpEmail({
        body: {
          email: CITIZEN_USER.email,
          password: CITIZEN_USER.password,
          name: CITIZEN_USER.name,
        }
      });
      citizen = await db.user.update({
        where: { email: CITIZEN_USER.email },
        data: { emailVerified: true }
      });
    }

    // 2. Admin User
    let admin = await db.user.findUnique({ where: { email: ADMIN_USER.email } });
    if (!admin) {
      await auth.api.signUpEmail({
        body: {
          email: ADMIN_USER.email,
          password: ADMIN_USER.password,
          name: ADMIN_USER.name,
        }
      });
      admin = await db.user.update({
        where: { email: ADMIN_USER.email },
        data: { role: 'ADMIN', emailVerified: true }
      });
    }

    // 3. Officer User & Municipality Membership
    let officer = await db.user.findUnique({ where: { email: OFFICER_USER.email } });
    if (!officer) {
      await auth.api.signUpEmail({
        body: {
          email: OFFICER_USER.email,
          password: OFFICER_USER.password,
          name: OFFICER_USER.name,
        }
      });
      officer = await db.user.update({
        where: { email: OFFICER_USER.email },
        data: { emailVerified: true }
      });
    }

    // Ensure test municipality exists
    let mun = await db.municipality.findUnique({ where: { name: 'E2E Test City' } });
    if (!mun) {
      mun = await db.municipality.create({ data: { name: 'E2E Test City' } });
    }

    const member = await db.municipalityMember.findUnique({ where: { userId: officer.id } });
    if (!member) {
      await db.municipalityMember.create({
        data: {
          userId: officer.id,
          municipalityId: mun.id,
          role: MunicipalityRole.OFFICER
        }
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

  const mun = await db.municipality.findUnique({ where: { name: 'E2E Test City' } });

  return await db.pothole.create({
    data: {
      title,
      description: 'E2E test pothole description for social & upvote verification.',
      latitude: 12.9716,
      longitude: 77.5946,
      severity: 6,
      status: 'PENDING',
      userId: citizen.id,
      municipalityId: mun?.id
    }
  });
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.context().clearCookies();
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[name="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15000 });

  const passwordInput = page.locator('input[name="password"]');
  const submitBtn = page.locator('button[type="submit"]:has-text("Login")');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  await page.waitForURL((url) => !url.href.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}
