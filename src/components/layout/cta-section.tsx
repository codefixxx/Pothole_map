'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { PlusCircle, MapPin, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface CtaSectionProps {
    className?: string;
    title?: string;
    description?: string;
}

export function CtaSection({
    className = '',
    title = 'Spotted a Road Hazard? Report It in 10 Seconds.',
    description = 'Your report automatically routes to the responsible municipal jurisdiction via PostGIS containment matching. Help make your city roads safer.',
}: CtaSectionProps) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/10 via-background to-amber-600/5 p-8 sm:p-10 shadow-lg ${className}`}>
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center sm:items-start sm:text-left justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Sparkles className="size-3.5" />
                        <span>Civic Action Engine</span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        {title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Button
                        asChild
                        size="lg"
                        className="gap-2 shadow-md bg-amber-600 hover:bg-amber-700 text-white font-semibold h-11 px-6 text-sm"
                    >
                        <Link href="/map?report=true">
                            <PlusCircle className="size-4" />
                            <span>Report Pothole</span>
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="gap-2 h-11 px-5 text-sm font-medium border-border/80 hover:bg-accent"
                    >
                        <Link href="/map">
                            <MapPin className="size-4 text-amber-500" />
                            <span>Explore Live Map</span>
                            <ArrowRight className="size-3.5 opacity-60" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
