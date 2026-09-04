import React from 'react';
import Link from 'next/link';
import { Logo, ThemeToggle } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { AlertTriangle, ArrowLeft, RefreshCw, Home, HelpCircle } from 'lucide-react';

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
    CredentialsSignin: {
        title: 'Invalid Credentials',
        description: 'The email or password you entered is incorrect. Please check your details and try again.',
    },
    OAuthSignin: {
        title: 'OAuth Connection Error',
        description: 'Unable to connect to the authentication provider. Please try again or use another login method.',
    },
    OAuthCallback: {
        title: 'Authentication Callback Failed',
        description: 'An issue occurred while receiving authentication response from the provider.',
    },
    OAuthCreateAccount: {
        title: 'Could Not Create Account',
        description: 'We were unable to create your account through the third-party provider.',
    },
    EmailCreateAccount: {
        title: 'Account Creation Failed',
        description: 'An account could not be created with this email. An existing account may already use it.',
    },
    OAuthAccountNotLinked: {
        title: 'Email Already Linked',
        description: 'This email is already associated with another login provider. Please log in using your original method.',
    },
    EmailSignin: {
        title: 'Email Verification Failed',
        description: 'The sign-in link could not be verified or has expired. Please request a new link.',
    },
    SessionRequired: {
        title: 'Session Expired',
        description: 'Your session has expired or is invalid. Please sign in again to continue.',
    },
    AccessDenied: {
        title: 'Access Denied',
        description: 'You do not have permission to access this resource.',
    },
};

export default async function LoginErrorPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const errorCode = typeof params.error === 'string' ? params.error : undefined;
    const errorDetails = typeof params.error_description === 'string' ? params.error_description : undefined;

    const errorInfo = (errorCode && ERROR_MESSAGES[errorCode]) || {
        title: 'Sign In Failed',
        description:
            errorDetails ||
            'There was an unexpected error during the authentication process. Please try logging in again.',
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-destructive/10 blur-3xl" />
            </div>

            {/* Top Corner Controls */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Brand Header */}
            <Link href="/" className="mb-6 flex items-center gap-2 group transition-transform hover:scale-105">
                <Logo className="h-9" />
                <span className="font-bold text-lg tracking-tight text-foreground">
                    Pothole<span className="text-amber-500 dark:text-amber-400">Map</span>
                </span>
            </Link>

            {/* Error Card */}
            <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur-md">
                <CardHeader className="text-center pb-3">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-8 ring-destructive/10">
                        <AlertTriangle className="size-6" />
                    </div>

                    <div className="flex justify-center mb-1">
                        <Badge variant="destructive" className="text-[11px] uppercase tracking-wider font-semibold">
                            {errorCode || 'Auth Error'}
                        </Badge>
                    </div>

                    <CardTitle className="text-xl font-bold tracking-tight text-foreground pt-1">
                        {errorInfo.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground pt-1 px-4 leading-relaxed">
                        {errorInfo.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
                        <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                        <span>
                            If this issue persists, please check your network connection or try logging in with another provider.
                        </span>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button asChild className="w-full gap-2 shadow-xs" size="default">
                        <Link href="/auth/login">
                            <RefreshCw className="size-4" />
                            <span>Try Signing In Again</span>
                        </Link>
                    </Button>

                    <div className="grid grid-cols-2 gap-2 w-full mt-1">
                        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <Link href="/">
                                <Home className="size-3.5" />
                                <span>Homepage</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <Link href="/map">
                                <span>Live Map</span>
                                <ArrowLeft className="size-3.5 rotate-180" />
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}