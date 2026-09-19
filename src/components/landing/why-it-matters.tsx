'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Car, TriangleAlert, Clock, ShieldAlert } from 'lucide-react';
import { ScrollTextEffect, ScrollAppear } from '@/src/components/motion';

const items = [
    {
        icon: Car,
        iconBg: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
        title: 'Severe Vehicle Damage',
        desc: 'Thousands of commuters face costly suspension, tire, and wheel rim damages every year due to unmapped road defects.',
    },
    {
        icon: TriangleAlert,
        iconBg: 'bg-red-500/10 text-red-500 ring-red-500/20',
        title: 'Road Accident Risks',
        desc: 'Unmarked craters cause sudden swerving, creating high collision risks for two-wheelers and night drivers.',
    },
    {
        icon: Clock,
        iconBg: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
        title: 'Delayed Civic Response',
        desc: 'Municipal bodies often lack real-time jurisdictional visibility, delaying repair dispatches for months.',
    },
];

export default function WhyItMatters() {
    return (
        <section className="py-16 md:py-24 bg-muted/20 border-y border-border/40">
            <div className="mx-auto max-w-6xl px-6 space-y-12">
                <div className="mx-auto max-w-2xl text-center space-y-4">
                    <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full">
                        <ShieldAlert className="size-3.5" />
                        The Civic Challenge
                    </Badge>

                    <ScrollTextEffect
                        as="h2"
                        per="word"
                        className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]"
                    >
                        Why Real-Time Hazard Tracking Matters
                    </ScrollTextEffect>

                    <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Unmapped road infrastructure hazards lead to vehicle damage, collisions, and delayed repair dispatches. A transparent public mapping platform empowers authorities to act faster.
                    </p>
                </div>

                <ScrollAppear className="grid gap-6 sm:grid-cols-3">
                    {items.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={index}
                                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 backdrop-blur-md"
                            >
                                <CardHeader className="space-y-4 p-6">
                                    <div className={`size-12 rounded-xl flex items-center justify-center ring-1 ${item.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
                                        <Icon className="size-6" />
                                    </div>
                                    <CardTitle className="text-xl font-bold tracking-tight">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-6 pt-0">
                                    <CardDescription className="text-sm leading-relaxed text-muted-foreground/90 font-normal">
                                        {item.desc}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        );
                    })}
                </ScrollAppear>
            </div>
        </section>
    );
}