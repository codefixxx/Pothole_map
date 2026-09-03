'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapView } from '@/src/components/map/map-view';
import { MapMarkerItem, STATUS_COLORS } from '@/src/lib/map-config';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Logo } from '@/src/components/logo';
import { useSession } from '@/src/lib/auth-client';
import { DropdownMenuAvatar } from '@/src/components/dropdown-menu-avatar';
import {
    MapPin,
    PlusCircle,
    SlidersHorizontal,
    ThumbsUp,
    Clock,
    X,
    ExternalLink,
    AlertTriangle,
    Layers,
    Info,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';

// Sample demonstration markers in case the local database is fresh/empty
const SAMPLE_MARKERS: MapMarkerItem[] = [
    {
        id: 'sample-1',
        latitude: 28.6139,
        longitude: 77.209,
        title: 'Deep crater on Rajpath Junction',
        description: 'Large pothole on the outer lane causing severe traffic slowdown and hazard for two-wheelers.',
        status: 'PENDING',
        severity: 'HIGH',
        upvotesCount: 14,
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-2',
        latitude: 28.625,
        longitude: 77.218,
        title: 'Asphalt erosion near Connaught Place',
        description: 'Multiple surface cracks expanding following monsoon rains.',
        status: 'VERIFIED',
        severity: 'MEDIUM',
        upvotesCount: 8,
        imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-3',
        latitude: 28.605,
        longitude: 77.225,
        title: 'Road subsidence on Lodhi Road',
        description: 'Road foundation sinking; barricades requested.',
        status: 'IN_PROGRESS',
        severity: 'HIGH',
        upvotesCount: 22,
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-4',
        latitude: 28.592,
        longitude: 77.21,
        title: 'Filled and resurfaced crater',
        description: 'Patch repair completed by municipal road crew.',
        status: 'RESOLVED',
        severity: 'LOW',
        upvotesCount: 31,
    },
];

const STATUS_FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
];

export default function MapPage() {
    const { data: session } = useSession();
    const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
    const [activeFilter, setActiveFilter] = useState('ALL');

    // Fetch reports from backend
    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch('/api/potholes');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                        const fetched: MapMarkerItem[] = json.data.map((p: any) => ({
                            id: p.id,
                            latitude: p.latitude,
                            longitude: p.longitude,
                            title: p.description ? p.description.slice(0, 45) + '...' : `Pothole #${p.id.slice(0, 6)}`,
                            description: p.description || 'No description provided.',
                            status: p.status,
                            severity: p.severity,
                            upvotesCount: p.votes?.length || p.upvotesCount || 0,
                            imageUrl: p.reportImage?.url || p.imageUrl,
                        }));
                        setMarkers(fetched);
                    } else {
                        // Use sample markers if no reports exist in DB yet
                        setMarkers(SAMPLE_MARKERS);
                    }
                } else {
                    setMarkers(SAMPLE_MARKERS);
                }
            } catch {
                setMarkers(SAMPLE_MARKERS);
            } finally {
                setLoading(false);
            }
        }

        fetchReports();
    }, []);

    // Filter markers by status
    const filteredMarkers = useMemo(() => {
        if (activeFilter === 'ALL') return markers;
        return markers.filter((m) => m.status === activeFilter);
    }, [markers, activeFilter]);

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            {/* Top Navigation Bar */}
            <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo className="h-7" />
                    </Link>
                    <div className="hidden items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium sm:flex">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        <span>Vector Map Live</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button asChild size="sm" className="gap-1.5 shadow-sm">
                        <Link href="/auth/login">
                            <PlusCircle className="size-4" />
                            <span className="hidden sm:inline">Report Pothole</span>
                            <span className="sm:hidden">Report</span>
                        </Link>
                    </Button>

                    {session?.user ? (
                        <DropdownMenuAvatar imageUrl={session.user.image} name={session.user.name} />
                    ) : (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/auth/login">Login</Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Map Body & Controls */}
            <div className="relative flex-1">
                {/* Vector Map */}
                <MapView
                    markers={filteredMarkers}
                    onMarkerClick={(marker) => setSelectedMarker(marker)}
                    className="h-full w-full rounded-none border-none"
                    showControls={true}
                />

                {/* Floating Filter Bar */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 rounded-2xl border bg-background/90 p-1.5 shadow-lg backdrop-blur-md sm:left-6">
                    <div className="flex items-center gap-1 px-2 text-xs font-semibold text-muted-foreground">
                        <Layers className="size-3.5" />
                        <span className="hidden md:inline">Status:</span>
                    </div>
                    {STATUS_FILTERS.map((f) => (
                        <Button
                            key={f.value}
                            size="xs"
                            variant={activeFilter === f.value ? 'default' : 'ghost'}
                            onClick={() => setActiveFilter(f.value)}
                            className="h-7 rounded-lg text-xs font-medium"
                        >
                            {f.label}
                        </Button>
                    ))}
                    <div className="hidden border-l pl-2 pr-1 sm:block">
                        <Badge variant="secondary" className="text-[11px] font-normal">
                            {filteredMarkers.length} {filteredMarkers.length === 1 ? 'hazard' : 'hazards'}
                        </Badge>
                    </div>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-4 z-10 hidden rounded-xl border bg-background/90 p-2.5 text-xs shadow-md backdrop-blur-md sm:left-6 md:block">
                    <div className="mb-1.5 font-semibold text-muted-foreground">Status Legend</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {Object.entries(STATUS_COLORS).slice(0, 6).map(([status, config]) => (
                            <div key={status} className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: config.hex }} />
                                <span className="capitalize text-[11px] text-foreground">
                                    {status.toLowerCase().replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Pothole Preview Card */}
                {selectedMarker && (
                    <div className="absolute bottom-6 right-4 left-4 z-20 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200 sm:right-6 sm:left-auto sm:w-96">
                        <Card className="border-primary/20 bg-background/95 shadow-2xl backdrop-blur-md">
                            <CardHeader className="relative pb-2">
                                <button
                                    onClick={() => setSelectedMarker(null)}
                                    className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Close card"
                                >
                                    <X className="size-4" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={`font-semibold uppercase text-[10px] ${STATUS_COLORS[selectedMarker.status]?.bg || ''} ${STATUS_COLORS[selectedMarker.status]?.text || ''} ${STATUS_COLORS[selectedMarker.status]?.border || ''}`}
                                        variant="outline"
                                    >
                                        {selectedMarker.status.replace('_', ' ')}
                                    </Badge>
                                    {selectedMarker.severity && (
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] ${
                                                selectedMarker.severity === 'HIGH'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : selectedMarker.severity === 'MEDIUM'
                                                      ? 'text-amber-600 dark:text-amber-400'
                                                      : 'text-zinc-600 dark:text-zinc-400'
                                            }`}
                                        >
                                            {selectedMarker.severity} Severity
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="pt-2 text-base font-semibold leading-tight">
                                    {selectedMarker.title}
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2">
                                    {selectedMarker.description}
                                </CardDescription>
                            </CardHeader>

                            {selectedMarker.imageUrl && (
                                <div className="relative mx-6 h-36 overflow-hidden rounded-lg border bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={selectedMarker.imageUrl}
                                        alt={selectedMarker.title || 'Pothole'}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}

                            <CardFooter className="flex items-center justify-between pt-3 pb-4">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ThumbsUp className="size-3.5 text-primary" />
                                    <span>{selectedMarker.upvotesCount || 0} confirmations</span>
                                </div>
                                <Button size="sm" variant="outline" className="gap-1 text-xs">
                                    <span>View Details</span>
                                    <ExternalLink className="size-3" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
