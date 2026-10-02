import { auth } from '@/src/lib/auth';
import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import { headers } from 'next/headers';

export const POST = asyncHandler(async (req: Request) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new AppError('Unauthorized', 401);
    }
    if (session.user.emailVerified) {
        throw new AppError('Your email address is already verified.', 400);
    }

    try {
        await auth.api.sendVerificationEmail({
            body: {
                email: session.user.email,
                callbackURL: '/auth/verify/success',
            },
            headers: await headers(),
        });
    } catch (err) {
        console.error('Failed to trigger sendVerificationEmail:', err);
    }

    return Response.json({
        success: true,
        message: 'Verification link sent to your email address.',
    });
});
