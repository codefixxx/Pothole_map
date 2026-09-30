import React from 'react';
import { InfiniteSlider, ProgressiveBlur, ScrollAppear } from '@/src/components/motion';
import {
    MapPin,
    ShieldCheck,
    Layers,
    Sparkles,
    ThumbsUp,
    Building2,
    Bell,
    Globe,
} from 'lucide-react';

const PLATFORM_CAPABILITIES = [
    {
        title: 'Instant GPS Acquisition',
        subtitle: '1-Click Location & Photo Capture',
        icon: MapPin,
        iconColor: 'text-amber-500 bg-amber-500/10',
    },
    {
        title: 'PostGIS Polygon Routing',
        subtitle: 'Automated Municipal Boundary Match',
        icon: ShieldCheck,
        iconColor: 'text-emerald-500 bg-emerald-500/10',
    },
    {
        title: 'State Machine Audit',
        subtitle: 'Strict Status Lifecycle Progression',
        icon: Layers,
        iconColor: 'text-purple-500 bg-purple-500/10',
    },
    {
        title: 'AI Duplicate Merging',
        subtitle: 'Proximity & Visual Consolidation',
        icon: Sparkles,
        iconColor: 'text-blue-500 bg-blue-500/10',
    },
    {
        title: 'Commuter Upvotes',
        subtitle: 'Crowdsourced Hazard Confirmation',
        icon: ThumbsUp,
        iconColor: 'text-sky-500 bg-sky-500/10',
    },
    {
        title: 'Municipal Triage Queue',
        subtitle: 'Officer Workflow & Reassignment',
        icon: Building2,
        iconColor: 'text-indigo-500 bg-indigo-500/10',
    },
    {
        title: 'Realtime Status Alerts',
        subtitle: 'In-App & Email Event Stream',
        icon: Bell,
        iconColor: 'text-rose-500 bg-rose-500/10',
    },
    {
        title: 'Vector Map Engine',
        subtitle: 'GPU-Accelerated MapLibre Rendering',
        icon: Globe,
        iconColor: 'text-teal-500 bg-teal-500/10',
    },
];

export const LogoCloud = () => {
    return (
        <ScrollAppear className="bg-background pb-12">
            <div className="group relative m-auto max-w-6xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="inline md:max-w-44 md:border-r md:pr-6 mb-4 md:mb-0">
                        <p className="text-center md:text-end text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90 leading-snug">
                            Platform Capabilities & Civic Workflows
                        </p>
                    </div>

                    <div className="relative py-4 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider speedOnHover={120} speed={40} gap={32}>
                            {PLATFORM_CAPABILITIES.map((cap, i) => {
                                const IconComponent = cap.icon;
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-2.5 shadow-xs backdrop-blur-xs hover:border-primary/40 hover:bg-card transition-all"
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 ${cap.iconColor}`}>
                                            <IconComponent className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground whitespace-nowrap">
                                                {cap.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {cap.subtitle}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </InfiniteSlider>

                        <div className="bg-gradient-to-r from-background absolute inset-y-0 left-0 w-16 pointer-events-none"></div>
                        <div className="bg-gradient-to-l from-background absolute inset-y-0 right-0 w-16 pointer-events-none"></div>

                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-16"
                            direction="left"
                            blurIntensity={1}
                        />

                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-16"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </ScrollAppear>
    );
};
