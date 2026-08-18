import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const protectedRoutes = ['/dashboard', '/admin/dashboard', '/profile-settings'];

export async function proxy(request: NextRequest) {
    const { nextUrl } = request;
    const sessionCookie = getSessionCookie(request);
    const res = NextResponse.next();
    const isLoggedIn = sessionCookie ? true : false;
    const isOnProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
    const isOnAuthRouted = nextUrl.pathname.startsWith('/auth');

    if (isOnProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // THIS IS NOT SECURE!
    // This is the recommended approach to optimistically redirect users
    // We recommend handling auth checks in each page/route
    if (isOnAuthRouted && isLoggedIn) {
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
