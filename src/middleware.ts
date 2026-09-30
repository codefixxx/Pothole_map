import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, getClientIp, RATE_LIMIT_CONFIGS } from './lib/rate-limit';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const method = req.method;

    // Apply API rate limiting on /api endpoints
    if (pathname.startsWith('/api')) {
        let rule = RATE_LIMIT_CONFIGS.default_api;

        if (pathname === '/api/potholes' && method === 'POST') {
            rule = RATE_LIMIT_CONFIGS.pothole_create;
        } else if (pathname.includes('/votes') && method === 'POST') {
            rule = RATE_LIMIT_CONFIGS.upvote;
        } else if (pathname.includes('/comments') && method === 'POST') {
            rule = RATE_LIMIT_CONFIGS.comment;
        } else if (pathname.startsWith('/api/uploadthing')) {
            rule = RATE_LIMIT_CONFIGS.upload;
        } else if (pathname === '/api/contact' && method === 'POST') {
            rule = RATE_LIMIT_CONFIGS.contact;
        } else if (pathname.startsWith('/api/auth')) {
            rule = RATE_LIMIT_CONFIGS.auth;
        }

        const clientIp = getClientIp(req);
        const identifier = `${clientIp}:${pathname}:${method}`;
        const result = await rateLimit(identifier, rule.limit, rule.windowSeconds);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.resetInSeconds,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(result.resetInSeconds),
                        'X-RateLimit-Limit': String(result.limit),
                        'X-RateLimit-Remaining': String(result.remaining),
                        'X-RateLimit-Reset': String(result.resetInSeconds),
                    },
                }
            );
        }

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', String(result.limit));
        response.headers.set('X-RateLimit-Remaining', String(result.remaining));
        response.headers.set('X-RateLimit-Reset', String(result.resetInSeconds));
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
