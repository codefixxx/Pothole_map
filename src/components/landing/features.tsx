'use client';

import {
    MapPin,
    Navigation,
    Users,
    BarChart3,
    ShieldCheck,
    Zap,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ScrollTextEffect, ScrollAppear } from '@/src/components/motion';
import Link from 'next/link';

const featureItems = [
    {
        icon: MapPin,
        iconBg: 'bg-red-500/10 text-red-500 ring-red-500/20',
        title: 'Instant GPS Geo-Tagging',
        description: 'Report road defects in seconds with high-precision GPS positioning and interactive map pin adjustment.',
        href: '/map?report=true',
        linkText: 'Test Report Flow',
    },
    {
        icon: Navigation,
        iconBg: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
        title: 'Live Road Vector Engine',
        description: 'Explore live hazard hotspots, spatial boundary overlays, and high-resolution satellite photography.',
        href: '/map',
        linkText: 'Explore Vector Map',
    },
    {
        icon: Users,
        iconBg: 'bg-purple-500/10 text-purple-500 ring-purple-500/20',
        title: 'Community Verification',
        description: 'Citizens upvote nearby reports to elevate priority scores and accelerate municipal dispatch.',
        href: '/dashboard',
        linkText: 'View Community Hub',
    },
    {
        icon: BarChart3,
        iconBg: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
        title: 'AI Duplicate Detection',
        description: 'Proximity radiuses and image similarity algorithms automatically pair candidate reports for 1-click officer merging.',
        href: '/municipality/dashboard',
        linkText: 'See AI Merging',
    },
    {
        icon: ShieldCheck,
        iconBg: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
        title: 'Municipal Officer Triage',
        description: 'PostGIS boundary auto-routing and state machine lifecycle transitions enforce immutable audit compliance.',
        href: '/municipality/dashboard',
        linkText: 'Officer Portal',
    },
    {
        icon: Zap,
        iconBg: 'bg-indigo-500/10 text-indigo-500 ring-indigo-500/20',
        title: 'Real-Time SSE Sync',
        description: 'Server-Sent Events stream live status updates across citizen feeds and municipal queues instantly.',
        href: '/admin/dashboard',
        linkText: 'Super Admin Portal',
    },
];

export default function Features() {
    return (
        <section className="py-16 md:py-24 bg-background" id="features">
            <div className="mx-auto max-w-6xl px-6 space-y-12">
                <div className="mx-auto max-w-2xl text-center space-y-4">
                    <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-1.5 border-primary/30 text-primary bg-primary/10 rounded-full">
                        <Sparkles className="size-3.5 text-amber-500" />
                        Platform Capabilities
                    </Badge>

                    <ScrollTextEffect
                        per="word"
                        as="h2"
                        className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]"
                    >
                        Powering the Future of Civic Road Safety
                    </ScrollTextEffect>

                    <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Combining real-time geo-location, AI duplicate consolidation, and PostGIS boundary routing to streamline civic infrastructure repairs.
                    </p>
                </div>

                <ScrollAppear className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featureItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Card
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm flex flex-col justify-between"
                            >
                                <CardHeader className="space-y-4 p-6">
                                    <div className={`size-11 rounded-xl flex items-center justify-center ring-1 ${item.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
                                        <Icon className="size-5.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground/90 font-normal">
                                            {item.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-6 pb-6 pt-0 mt-auto">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-0 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary/80 gap-1.5"
                                    >
                                        <Link href={item.href}>
                                            <span>{item.linkText}</span>
                                            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </ScrollAppear>
            </div>
        </section>
    );
}
