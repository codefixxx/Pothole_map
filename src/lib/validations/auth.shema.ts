import { z } from 'zod';

export const signupSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be less than 50 characters')
            .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),

        email: z.email('Invalid email'),

        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(128, 'Password too long')
            .regex(/[a-zA-Z0-9]/, 'Password must contain letters or numbers'),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const loginSchema = z.object({
    email: z.email({ message: 'Invalid email' }),
    password: z.string(),
});

export const updateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
        .optional(),

    username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(25, 'Username must be less than 25 characters')
    .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/,
        'Username should start with a letter; end with a letter or number; only letters, numbers, _ or -'
    )
    .optional(),
});

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(128, 'Password too long')
            .regex(/[a-zA-Z0-9]/, 'Password must contain letters or numbers'),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
