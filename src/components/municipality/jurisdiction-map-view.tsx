'use client';

import React, { useMemo } from 'react';
import { MapView, MapContainerRef } from '@/src/components/map/map-view';
import { MapMarkerItem } from '@/src/lib/map-config';
import { MunicipalJurisdiction, TriagePotholeItem } from './types';
import { Badge } from '@/src/components/ui/badge';
import { Layers, MapPin } from 'lucide-react';

interface JurisdictionMapViewProps {
    jurisdiction: MunicipalJurisdiction | null;
    potholes: TriagePotholeItem[];
    selectedPotholeId?: string | null;
    onSelectPothole: (pothole: TriagePotholeItem) => void;
    className?: string;
}

export function JurisdictionMapView({
    jurisdiction,
    potholes,
    selectedPotholeId,
    onSelectPothole,
    className = 'h-[360px] w-full rounded-xl overflow-hidden border border-border/80 shadow-xs relative',
}: JurisdictionMapViewProps) {
    // Convert triage potholes to map marker items
    const markers: MapMarkerItem[] = useMemo(() => {
        return potholes.map((p) => ({
            id: p.id,
            latitude: p.latitude,
            longitude: p.longitude,
            title: p.title,
            description: p.description,
            status: p.status,
            severity: p.severity >= 4 ? 'HIGH' : p.severity === 3 ? 'MEDIUM' : 'LOW',
            upvotesCount: p.votes?.length ?? p.votesCount ?? 0,
            imageUrl: p.imageUrl || undefined,
        }));
    }, [potholes]);

    // Compute center from potholes or jurisdiction
    const center: [number, number] = useMemo(() => {
        if (potholes.length > 0) {
            return [potholes[0].longitude, potholes[0].latitude];
        }
        return [77.2090, 28.6139]; // Default Central Delhi / NDMC
    }, [potholes]);

    const handleMarkerClick = (marker: MapMarkerItem) => {
        const found = potholes.find((p) => p.id === marker.id);
        if (found) onSelectPothole(found);
    };

    return (
        <div className={className}>
            <MapView
                center={center}
                zoom={13}
                markers={markers}
                selectedMarkerId={selectedPotholeId}
                onMarkerClick={handleMarkerClick}
                jurisdictionPolygon={jurisdiction?.boundary}
                className="w-full h-full"
            />

            {/* Jurisdiction Boundary Legend Overlay */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-background/90 backdrop-blur-md px-3 py-2 rounded-lg border border-border/70 shadow-sm text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{jurisdiction?.name || 'Municipal Jurisdiction'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span className="inline-block size-2 rounded-sm bg-blue-500/20 border border-blue-500" />
                    <span>PostGIS Service Polygon • {potholes.length} Active Defects</span>
                </div>
            </div>

            {/* Status Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/70 shadow-sm text-[10px]">
                <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-indigo-500" />
                    <span className="text-muted-foreground">Verified</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-sky-500" />
                    <span className="text-muted-foreground">Ongoing</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Fixed</span>
                </div>
            </div>
        </div>
    );
}
