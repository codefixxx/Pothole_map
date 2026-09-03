import React from 'react';
import EmailVerification from '@/src/components/email-verification';
import { redirect } from 'next/navigation';
import { Logo } from '@/src/components/logo';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { Badge } from '@/src/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const Page = async ({ searchParams }: PageProps) => {
    const params = await searchParams;
    const error = params.error as string | undefined;

    if (!error) {
        redirect('/dashboard');
    }

    const errorMessage =
        error === 'invalid_token' || error === 'token_expired'
            ? 'Your verification token is invalid or has expired.'
            : error === 'email_not_verified'
              ? 'Your email is not yet verified. Please request a new verification link below.'
              : 'An error occurred during email verification. Please request a fresh link.';

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Top Corner Controls */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Brand Logo */}
            <Link href="/" className="mb-4 flex items-center gap-2 group transition-transform hover:scale-105">
                <Logo className="h-9" />
                <span className="font-bold text-lg tracking-tight text-foreground">
                    Pothole<span className="text-amber-500 dark:text-amber-400">Map</span>
                </span>
            </Link>

            {/* Error Alert Box */}
            <div className="w-full max-w-md mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2.5 backdrop-blur-xs">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
            </div>

            {/* Email Verification Form Card */}
            <EmailVerification />
        </div>
    );
};

export default Page;