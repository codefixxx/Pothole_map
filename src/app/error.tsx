'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/src/components/logo';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function GlobalErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled application error:', error);
    }, [error]);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-destructive/10 blur-3xl" />
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Brand Logo Header */}
            <Link href="/" className="mb-6 flex items-center gap-2 group transition-transform hover:scale-105">
                <Logo className="h-9" />
                <span className="font-bold text-lg tracking-tight text-foreground">
                    Pothole<span className="text-amber-500 dark:text-amber-400">Map</span>
                </span>
            </Link>

            {/* 500 Error Card */}
            <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur-md text-center">
                <CardHeader className="pb-3">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-8 ring-destructive/10">
                        <AlertOctagon className="size-7" />
                    </div>

                    <div className="flex justify-center mb-1.5">
                        <Badge variant="destructive" className="text-[11px] font-mono uppercase tracking-wider">
                            500 • System Exception
                        </Badge>
                    </div>

                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Something Went Wrong
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground pt-1.5 px-4 leading-relaxed">
                        An unexpected application error occurred while processing your request. Our automated diagnostics have recorded the incident.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4">
                    {error.digest && (
                        <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-[11px] font-mono text-muted-foreground">
                            Digest ID: {error.digest}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button onClick={() => reset()} className="w-full gap-2 shadow-xs" size="default">
                        <RefreshCw className="size-4" />
                        <span>Try Again</span>
                    </Button>

                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <Link href="/">
                            <Home className="size-3.5" />
                            <span>Return to Homepage</span>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
