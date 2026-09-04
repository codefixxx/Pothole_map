import React from 'react';
import Link from 'next/link';
import { Logo, ThemeToggle } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { MapPin, Home, Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-amber-500/10 dark:bg-amber-400/5 blur-3xl" />
            </div>

            {/* Top Corner Controls */}
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

            {/* 404 Card */}
            <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur-md text-center">
                <CardHeader className="pb-3">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 ring-8 ring-amber-500/5">
                        <Compass className="size-7 animate-pulse" />
                    </div>

                    <div className="flex justify-center mb-1.5">
                        <Badge variant="outline" className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground border-border/80">
                            404 • Route Not Found
                        </Badge>
                    </div>

                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Off the Mapped Road
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground pt-1.5 px-4 leading-relaxed">
                        The page or pothole report you are looking for has been resolved, removed, or never existed on our civic grid.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4">
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <MapPin className="size-4 text-primary shrink-0" />
                        <span>Try searching for the hazard directly on the live vector map.</span>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button asChild className="w-full gap-2 shadow-xs" size="default">
                        <Link href="/map">
                            <MapPin className="size-4" />
                            <span>Explore Live Vector Map</span>
                        </Link>
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
