'use client';

import { ScrollTextEffect, ScrollAppear } from '@/src/components/motion';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Activity, MapPin, Building2, Users } from 'lucide-react';

const statsData = [
    {
        value: '12,400+',
        label: 'Hazards Mapped',
        subtext: 'Citizen reports captured & verified',
        icon: MapPin,
        iconColor: 'text-red-500',
    },
    {
        value: '89.4%',
        label: 'Resolution Rate',
        subtext: 'Fixed by municipal repair teams',
        icon: Activity,
        iconColor: 'text-emerald-500',
    },
    {
        value: '35+',
        label: 'Municipal Jurisdictions',
        subtext: 'PostGIS boundary mapped councils',
        icon: Building2,
        iconColor: 'text-blue-500',
    },
];

export default function StatsSection() {
    return (
        <section className="py-16 md:py-24 bg-muted/20 border-t border-border/40" id="stats">
            <div className="mx-auto max-w-6xl px-6 space-y-12">
                <div className="mx-auto max-w-2xl text-center space-y-4">
                    <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-1.5 border-primary/30 text-primary bg-primary/10 rounded-full">
                        <Activity className="size-3.5" />
                        Platform Impact
                    </Badge>

                    <ScrollTextEffect
                        per="word"
                        as="h2"
                        className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]"
                    >
                        Measurable Civic Impact
                    </ScrollTextEffect>

                    <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Real-time telemetry showing how citizen reporting drives faster municipal road repair resolutions across verified council jurisdictions.
                    </p>
                </div>

                <ScrollAppear className="grid gap-6 sm:grid-cols-3">
                    {statsData.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 backdrop-blur-md text-center"
                            >
                                <CardContent className="p-0 space-y-3">
                                    <div className="size-11 rounded-xl bg-muted flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110 shadow-xs">
                                        <Icon className={`size-5.5 ${stat.iconColor}`} />
                                    </div>
                                    <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
                                        {stat.value}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-base font-bold text-foreground">
                                            {stat.label}
                                        </div>
                                        <p className="text-xs text-muted-foreground/90 font-medium">
                                            {stat.subtext}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </ScrollAppear>
            </div>
        </section>
    );
}