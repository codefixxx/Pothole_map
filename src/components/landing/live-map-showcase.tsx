'use client';

import React, { useState } from 'react';
import { MapContainer } from '@/src/components/map';
import { MapMarkerItem } from '@/src/lib/map-config';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { BorderTrail } from '@/src/components/motion';
import {
    MapPin,
    ShieldCheck,
    Layers,
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const SAMPLE_HERO_MARKERS: MapMarkerItem[] = [
    {
        id: 'hero-1',
        title: 'Deep Crater Hazard near Connaught Place',
        description: 'Severe roadbed displacement causing heavy traffic obstruction.',
        latitude: 28.6139,
        longitude: 77.209,
        status: 'PENDING',
        severity: 'HIGH',
        upvotesCount: 42,
    },
    {
        id: 'hero-2',
        title: 'Asphalt Degradation at Ring Road',
        description: 'Multiple surface cracks forming wide pothole cluster.',
        latitude: 28.625,
        longitude: 77.218,
        status: 'IN_PROGRESS',
        severity: 'MEDIUM',
        upvotesCount: 18,
    },
    {
        id: 'hero-3',
        title: 'Repaired Pothole at India Gate Outer Circle',
        description: 'Municipality team completed hot-mix asphalt patching.',
        latitude: 28.6129,
        longitude: 77.2295,
        status: 'RESOLVED',
        severity: 'LOW',
        upvotesCount: 65,
    },
];

export function LiveMapShowcase() {
    const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(SAMPLE_HERO_MARKERS[0]);

    return (
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-2xl backdrop-blur-xl transition-all duration-300">
            <BorderTrail
                className="absolute inset-0 rounded-2xl"
                style={{
                    boxShadow:
                        '0px 0px 60px 30px rgba(59, 130, 246, 0.3), 0 0 100px 60px rgba(168, 85, 247, 0.2)',
                }}
                size={120}
            />

            {/* Header Overlay Bar */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3 px-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold tracking-tight text-foreground">
                        Live Interactive Map Engine
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        PostGIS Vector Tiles
                    </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                        <Activity className="size-3.5 text-blue-500" />
                        Real-time Routing Active
                    </span>
                </div>
            </div>

            {/* Interactive Map Canvas Container */}
            <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden rounded-xl border border-border/60">
                <MapContainer
                    center={[77.209, 28.6139]}
                    zoom={13}
                    markers={SAMPLE_HERO_MARKERS}
                    selectedMarkerId={selectedMarker?.id}
                    onMarkerClick={(marker) => setSelectedMarker(marker)}
                    className="h-full w-full min-h-[380px]"
                />

                {/* Floating Marker Quick Details Drawer */}
                {selectedMarker && (
                    <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto z-30 max-w-sm rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-foreground line-clamp-1">
                                {selectedMarker.title}
                            </span>
                            <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-bold ${
                                    selectedMarker.status === 'PENDING'
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                        : selectedMarker.status === 'IN_PROGRESS'
                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                }`}
                            >
                                {selectedMarker.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                            {selectedMarker.description}
                        </p>
                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                            <span className="text-muted-foreground font-medium">
                                👍 {selectedMarker.upvotesCount} Citizen Upvotes
                            </span>
                            <Button asChild size="sm" className="h-7 text-[11px] gap-1 rounded-lg px-2.5">
                                <Link href="/map">
                                    <span>Explore on Map</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Quick Feature Highlights */}
            <div className="relative z-20 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-center">
                <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="text-xs font-semibold text-foreground">100% PostGIS</div>
                    <div className="text-[10px] text-muted-foreground">Spatial Boundary Containment</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="text-xs font-semibold text-emerald-500">Live SSE Updates</div>
                    <div className="text-[10px] text-muted-foreground">Instant Status Sync</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="text-xs font-semibold text-blue-500">AI Duplicate Check</div>
                    <div className="text-[10px] text-muted-foreground">Image Similarity Match</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="text-xs font-semibold text-amber-500">HD Satellite</div>
                    <div className="text-[10px] text-muted-foreground">Esri World Imagery</div>
                </div>
            </div>
        </div>
    );
}
