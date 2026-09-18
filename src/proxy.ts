import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const protectedRoutes = ['/dashboard', '/admin/dashboard', '/profile-settings', '/municipality', '/municipality/dashboard'];

export async function proxy(request: NextRequest) {
    const { nextUrl } = request;
    const sessionCookie = getSessionCookie(request);
    const res = NextResponse.next();
    const isLoggedIn = sessionCookie ? true : false;
    const isOnProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route));
    const isOnAuthRoute = nextUrl.pathname.startsWith('/auth');

    if (isOnProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, request.url));
    }

    if (isOnAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return res;
}

export const config = {
    matcher: [
        // Exclude API routes, static files, image optimizations, and .png files
        '/((?!api|_next/static|_next/image|.*\\.png$).*)',
    ], // Specify the routes the middleware applies to
};
