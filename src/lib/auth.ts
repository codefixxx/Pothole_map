import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';
import { nextCookies } from 'better-auth/next-js';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { getValidDomains, normalizeName } from './utils';
import { sendEmail } from './nodemailer';
import { generateUniqueUsername } from './username';

export const auth = betterAuth({
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
            void sendEmail({
                to: user.email,
                subject: 'Reset your password',
                meta: {
                    description:
                        'Click the button below to reset your password.',
                    link: url,
                },
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 60 * 60 * 24, // 24 hours
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const link = new URL(url);
            link.searchParams.set('callbackURL', '/auth/verify');
            void sendEmail({
                to: user.email,
                subject: 'Verify your email',
                meta: {
                    description:
                        'Please verify your email address to activate your account.',
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
            username: {
                type: 'string',
                required: false,
                input: false, // never from client
            },
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
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const username = await generateUniqueUsername(
                        user.name ?? 'user',
                    );
                    return { data: { ...user, username } };
                },
            },
        },
    },
    plugins: [nextCookies()],
});
