import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    BETTER_AUTH_SECRET: z.string().refine(
        (val) => {
            if (process.env.NODE_ENV === 'production') {
                const forbiddenDefaults = [
                    'secret',
                    'change-me',
                    'default_secret',
                    '1234567890',
                    'your_auth_secret_here',
                ];
                return (
                    val.length >= 16 &&
                    !forbiddenDefaults.includes(val.toLowerCase())
                );
            }
            return val.length > 0;
        },
        {
            message:
                'BETTER_AUTH_SECRET must be at least 16 characters and cannot be a default placeholder in production',
        }
    ),
    REDIS_URL: z.string().optional().default('redis://127.0.0.1:6379'),
    UPLOADTHING_SECRET: z.string().optional(),
    UPLOADTHING_APP_ID: z.string().optional(),
    APP_DEBUG: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const formattedErrors = parsed.error.flatten().fieldErrors;
        console.error('❌ Invalid environment configuration:', formattedErrors);
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                `Fatal: Invalid environment configuration in production: ${JSON.stringify(
                    formattedErrors
                )}`
            );
        }
        return process.env as unknown as Env;
    }
    return parsed.data;
}

export const env = validateEnv();
