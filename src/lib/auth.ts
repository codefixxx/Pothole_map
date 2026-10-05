import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';
import { nextCookies } from 'better-auth/next-js';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { getValidDomains, normalizeName } from './utils';
import { sendEmail } from './nodemailer';

export function getBaseUrl(): string {
    if (process.env.BETTER_AUTH_BASE_URL) {
        return process.env.BETTER_AUTH_BASE_URL;
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
}

export const auth = betterAuth({
    baseURL: getBaseUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        autoSignIn: false,
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 60 * 60,
        sendResetPassword: async ({ user, url }) => {
            const baseUrl = getBaseUrl();
            let targetPath = url;
            if (targetPath.startsWith('/reset-password')) {
                targetPath = `/auth${targetPath}`;
            }
            const link = new URL(targetPath, baseUrl);
            console.log('[Auth] Generated Reset Password link:', link.toString());
            await sendEmail({
                to: user.email,
                subject: 'Reset your password - PotholeMap',
                meta: {
                    description:
                        'Click the button below to reset your password.',
                    link: link.toString(),
                },
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 60 * 60 * 24, // 24 hours
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const baseUrl = getBaseUrl();
            let targetPath = url;
            if (targetPath.startsWith('/verify-email')) {
                targetPath = `/api/auth${targetPath}`;
            }
            const link = new URL(targetPath, baseUrl);
            link.searchParams.set('callbackURL', `${baseUrl}/auth/verify/success`);

            await sendEmail({
                to: user.email,
                subject: 'Verify your email address - PotholeMap',
                meta: {
                    description:
                        'Please click the button below to verify your email address and activate full pothole reporting access.',
                    link: link.toString(),
                },
            });
        },
    },
    socialProviders: {
        google: {
            prompt: 'select_account',
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === '/sign-up/email') {
                const email = String(ctx.body.email);
                const domain = email.split('@')[1];
                if (!getValidDomains().includes(domain)) {
                    throw new APIError('BAD_REQUEST', {
                        message: 'Invalid email domain',
                    });
                }
                const name = normalizeName(String(ctx.body.name));
                return {
                    context: {
                        ...ctx,
                        body: {
                            ...ctx.body,
                            name,
                        },
                    },
                };
            }
        }),
    },
    user: {
        additionalFields: {
            role: {
                type: ['USER', 'ADMIN'],
                required: true,
                input: false,
                defaultValue: 'USER',
            },
            banned: {
                type: 'boolean',
                required: true,
                input: false,
                defaultValue: false,
            },
        },
    },
    plugins: [nextCookies()],
});

