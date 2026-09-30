import React from 'react';
import { InfiniteSlider, ProgressiveBlur, ScrollAppear } from '@/src/components/motion';

const TECH_STANDARDS = [
    {
        name: 'OpenStreetMap',
        logo: '/logo/OpenStreetMap.svg',
        desc: 'Open Mapping Data',
    },
    {
        name: 'MapLibre GL JS',
        logo: '/logo/Maplibre.svg',
        desc: 'Vector Map Engine',
    },
    {
        name: 'PostgreSQL & PostGIS',
        logo: '/logo/Postgresql.svg',
        desc: 'Spatial Containment',
    },
    {
        name: 'Next.js 15',
        logo: '/logo/Nextjs.svg',
        desc: 'React App Framework',
        invertDark: true,
    },
    {
        name: 'TypeScript',
        logo: '/logo/Typescript.svg',
        desc: 'Strict Type Safety',
    },
    {
        name: 'Shadcn UI',
        logo: '/logo/Shadcnui.svg',
        desc: 'Accessible Primitives',
        invertDark: true,
    },
];

export const LogoCloud = () => {
    return (
        <ScrollAppear className="bg-background pb-12">
            <div className="group relative m-auto max-w-6xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="inline md:max-w-44 md:border-r md:pr-6 mb-4 md:mb-0">
                        <p className="text-center md:text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 leading-snug">
                            Powered by Open Data & Standard Tech Stack
                        </p>
                    </div>

                    <div className="relative py-4 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider speedOnHover={120} speed={40} gap={64}>
                            {TECH_STANDARDS.map((tech, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 shadow-xs backdrop-blur-xs hover:border-primary/40 transition-colors"
                                >
                                    <img
                                        src={tech.logo}
                                        alt={tech.name}
                                        className={`h-6 w-auto object-contain ${tech.invertDark ? 'dark:invert' : ''}`}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                                            {tech.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {tech.desc}
                                        </span>
                                    </div>
                                </div>
                            ))}
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
