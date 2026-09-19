'use client';

import React from 'react';
import { MapPin, Camera, Radar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { ScrollTextEffect, ScrollAppear } from '@/src/components/motion';

const steps = [
    {
        step: '01',
        title: 'Spot & Capture',
        description: 'Citizen identifies a road defect and captures a photo with precise HTML5 GPS location tagging.',
        icon: MapPin,
        iconBg: 'bg-red-500/10 text-red-500 ring-red-500/20',
    },
    {
        step: '02',
        title: 'Instant Report',
        description: 'Upload photo details, select severity level, and fine-tune mini-map pin location in seconds.',
        icon: Camera,
        iconBg: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
    },
    {
        step: '03',
        title: 'AI Analysis',
        description: 'PostGIS spatial radius & AI image similarity match potential duplicate candidates automatically.',
        icon: Radar,
        iconBg: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    },
    {
        step: '04',
        title: 'Municipal Action',
        description: 'Auto-routed into official city council queue for officer verification, team assignment, and repair.',
        icon: CheckCircle2,
        iconBg: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    },
];

export function HowItWorks() {
    return (
        <section className="py-16 md:py-24 bg-background" id="solution">
            <div className="mx-auto max-w-6xl px-6 space-y-12">
                <div className="mx-auto max-w-2xl text-center space-y-4">
                    <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-1.5 border-primary/30 text-primary bg-primary/10 rounded-full">
                        <ArrowRight className="size-3.5" />
                        Simplified Workflow
                    </Badge>

                    <ScrollTextEffect
                        as="h2"
                        per="word"
                        className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]"
                    >
                        How PotholeMap Operates
                    </ScrollTextEffect>

                    <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        A transparent 4-step civic pipeline transforming raw road reports into verified municipal repair actions.
                    </p>
                </div>

                <ScrollAppear className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Card
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm"
                            >
                                <CardHeader className="space-y-4 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`size-11 rounded-xl flex items-center justify-center ring-1 ${item.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
                                            <Icon className="size-5.5" />
                                        </div>
                                        <span className="text-2xl font-black text-muted-foreground/30 font-mono tracking-tighter">
                                            {item.step}
                                        </span>
                                    </div>

                                    <CardTitle className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-6 pt-0">
                                    <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground/90 font-normal">
                                        {item.description}
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

export default HowItWorks;
