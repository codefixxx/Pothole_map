'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import { MapContainer } from '@/src/components/map/map-container';
import { MapPin, Globe, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface JurisdictionItem {
    id: string;
    name: string;
    municipalityId: string;
    municipalityName: string;
    boundary: number[][][];
}

interface JurisdictionVisualizerProps {
    jurisdictions: JurisdictionItem[];
    onRefresh: () => void;
    isLoading?: boolean;
}

export function JurisdictionVisualizer({ jurisdictions, onRefresh, isLoading }: JurisdictionVisualizerProps) {
    const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>('ALL');

    const selectedJurisdiction = useMemo(() => {
        if (selectedJurisdictionId === 'ALL') return null;
        return jurisdictions.find((j) => j.id === selectedJurisdictionId) || null;
    }, [jurisdictions, selectedJurisdictionId]);

    // Calculate center for map view if a specific jurisdiction is selected
    const mapCenter: [number, number] = useMemo(() => {
        if (!selectedJurisdiction || !selectedJurisdiction.boundary?.[0]?.[0]) {
            return [72.8777, 19.076]; // Default Mumbai center
        }
        const points = selectedJurisdiction.boundary[0];
        const avgLng = points.reduce((acc, p) => acc + p[0], 0) / points.length;
        const avgLat = points.reduce((acc, p) => acc + p[1], 0) / points.length;
        return [avgLng, avgLat];
    }, [selectedJurisdiction]);

    const vertexCount = useMemo(() => {
        if (!selectedJurisdiction || !selectedJurisdiction.boundary) return 0;
        return selectedJurisdiction.boundary.reduce((acc, ring) => acc + ring.length, 0);
    }, [selectedJurisdiction]);

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 w-full max-w-md">
                    <Layers className="size-5 text-primary shrink-0" />
                    <Select value={selectedJurisdictionId} onValueChange={setSelectedJurisdictionId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Jurisdiction Boundary..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Active Jurisdictions ({jurisdictions.length})</SelectItem>
                            {jurisdictions.map((j) => (
                                <SelectItem key={j.id} value={j.id}>
                                    {j.name} ({j.municipalityName})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                    <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Boundaries
                </Button>
            </div>

            {/* Main Visualizer Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Boundary Details Panel */}
                <Card className="lg:col-span-1 flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="size-4 text-primary" />
                            {selectedJurisdiction ? selectedJurisdiction.name : 'Platform GeoSpatial Boundaries'}
                        </CardTitle>
                        <CardDescription>
                            PostGIS Polygon boundaries used for automated report containment routing (`ST_Contains`).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedJurisdiction ? (
                            <div className="space-y-3 text-xs">
                                <div className="rounded-lg border p-3 space-y-2">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Municipality</span>
                                        <span className="font-semibold text-foreground">
                                            {selectedJurisdiction.municipalityName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Polygon Vertices</span>
                                        <Badge variant="outline">{vertexCount} Points</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Center Coordinates</span>
                                        <span className="font-mono text-[11px]">
                                            {mapCenter[1].toFixed(4)}° N, {mapCenter[0].toFixed(4)}° E
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-blue-500/5 p-3 text-blue-900 dark:text-blue-200">
                                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                                        <MapPin className="size-3 text-blue-500" />
                                        Automated Routing Active
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Any citizen report submitted within this polygon is automatically routed to{' '}
                                        <strong className="text-foreground">{selectedJurisdiction.municipalityName}</strong>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="rounded-lg border p-4 text-center space-y-2">
                                    <p className="font-medium">Showing Overview Map</p>
                                    <p className="text-muted-foreground">
                                        Select a specific jurisdiction boundary above to isolate its PostGIS polygon structure.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <span>Total Mapped Jurisdictions</span>
                                    <Badge>{jurisdictions.length}</Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Maplibre Map View */}
                <Card className="lg:col-span-2 overflow-hidden p-0 min-h-[420px] relative">
                    <MapContainer
                        center={mapCenter}
                        zoom={selectedJurisdiction ? 12 : 10}
                        jurisdictionPolygon={selectedJurisdiction ? selectedJurisdiction.boundary : null}
                        className="w-full h-full min-h-[420px]"
                    />
                </Card>
            </div>
        </div>
    );
}
