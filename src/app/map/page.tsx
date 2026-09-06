'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { MapView, MapContainerRef } from '@/src/components/map/map-view';
import { MapMarkerItem, STATUS_COLORS, DEFAULT_MAP_CENTER } from '@/src/lib/map-config';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Logo, ThemeToggle, DropdownMenuAvatar } from '@/src/components/layout';
import { ReportModal, ReportFAB } from '@/src/components/report';
import { PotholeDetailModal } from '@/src/components/pothole-detail';
import { UpvoteButton, ShareDialog } from '@/src/components/social';
import { NotificationBell } from '@/src/components/notifications';
import { useSession } from '@/src/lib/auth-client';
import { toast } from 'sonner';
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
    Search,
    Navigation,
    ListFilter,
    Map as MapIcon,
    ChevronRight,
    ArrowUpRight,
    ShieldAlert,
    Sparkles,
} from 'lucide-react';

const SAMPLE_MARKERS: MapMarkerItem[] = [
    {
        id: 'sample-1',
        latitude: 28.6139,
        longitude: 77.209,
        title: 'Deep crater on Rajpath Outer Junction',
        description: 'Large 40cm pothole on the outer commuter lane causing severe traffic slowdown and hazard for two-wheelers.',
        status: 'PENDING',
        severity: 'HIGH',
        upvotesCount: 19,
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-2',
        latitude: 28.628,
        longitude: 77.218,
        title: 'Asphalt erosion near Connaught Circus',
        description: 'Expanding surface cracks following heavy rainfall. High vehicle traffic impacting sub-base.',
        status: 'UNDER_REVIEW',
        severity: 'MEDIUM',
        upvotesCount: 11,
        imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-3',
        latitude: 28.602,
        longitude: 77.225,
        title: 'Road subsidence on Lodhi Road flyover',
        description: 'Structural roadbed sinking; verified by municipal patrol team and scheduled for resurfacing.',
        status: 'VERIFIED',
        severity: 'HIGH',
        upvotesCount: 28,
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-4',
        latitude: 28.591,
        longitude: 77.215,
        title: 'Excavation trench repair ongoing',
        description: 'Contractor crew on-site backfilling and leveling asphalt surface.',
        status: 'IN_PROGRESS',
        severity: 'MEDIUM',
        upvotesCount: 15,
        imageUrl: 'https://images.unsplash.com/photo-1584463699039-f9c158ff8458?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-5',
        latitude: 28.583,
        longitude: 77.23,
        title: 'Resurfaced road segment at Defence Colony',
        description: 'Permanent patch repair and compaction finished. Road reopened to regular transit.',
        status: 'RESOLVED',
        severity: 'LOW',
        upvotesCount: 34,
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'sample-6',
        latitude: 28.636,
        longitude: 77.202,
        title: 'Uneven manhole depression',
        description: 'Manhole rim exposed by 3 inches on arterial route. Dangerous for evening bikers.',
        status: 'PENDING',
        severity: 'HIGH',
        upvotesCount: 22,
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
    },
];

const STATUS_FILTERS = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
];

const SEVERITY_FILTERS = [
    { label: 'All Severities', value: 'ALL' },
    { label: 'High Priority', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
];

export default function MapPage() {
    const { data: session } = useSession();
    const mapRef = useRef<MapContainerRef>(null);

    const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [activeSeverity, setActiveSeverity] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
    const [isLocating, setIsLocating] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [inspectingPotholeId, setInspectingPotholeId] = useState<string | null>(null);

    // Auto-open modals if navigated with ?report=true or ?inspect=[id]
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('report') === 'true') {
                setIsReportOpen(true);
            }
            const inspectId = params.get('inspect') || params.get('pothole');
            if (inspectId) {
                setInspectingPotholeId(inspectId);
            }
        }
    }, []);

    // Handler when a new report is successfully filed
    const handleReportCreated = (newMarker: MapMarkerItem) => {
        setMarkers((prev) => [newMarker, ...prev]);
        setSelectedMarker(newMarker);
        mapRef.current?.flyTo([newMarker.longitude, newMarker.latitude], 16);
    };

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

    // Filter markers
    const filteredMarkers = useMemo(() => {
        return markers.filter((m) => {
            const matchesStatus = activeStatus === 'ALL' || m.status === activeStatus;
            const matchesSeverity = activeSeverity === 'ALL' || m.severity === activeSeverity;
            const matchesSearch =
                searchQuery.trim() === '' ||
                m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSeverity && matchesSearch;
        });
    }, [markers, activeStatus, activeSeverity, searchQuery]);

    // Handle selecting a marker and flying to it
    const handleSelectMarker = (marker: MapMarkerItem) => {
        setSelectedMarker(marker);
        mapRef.current?.flyTo([marker.longitude, marker.latitude], 15.5);
    };

    // Locate user position via HTML5 Geolocation
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                mapRef.current?.flyTo(coords, 15);
                toast.success('Centered on your current location!');
                setIsLocating(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                toast.error('Unable to retrieve your location.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Optimistic upvote handler
    const handleUpvote = async (markerId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const hasVoted = userVotes[markerId];
        const newVoted = !hasVoted;

        // Update local state optimistically
        setUserVotes((prev) => ({ ...prev, [markerId]: newVoted }));
        setMarkers((prev) =>
            prev.map((m) => {
                if (m.id === markerId) {
                    const currentCount = m.upvotesCount || 0;
                    return { ...m, upvotesCount: newVoted ? currentCount + 1 : Math.max(0, currentCount - 1) };
                }
                return m;
            })
        );

        if (selectedMarker && selectedMarker.id === markerId) {
            setSelectedMarker((prev) =>
                prev
                    ? {
                          ...prev,
                          upvotesCount: newVoted
                              ? (prev.upvotesCount || 0) + 1
                              : Math.max(0, (prev.upvotesCount || 0) - 1),
                      }
                    : null
            );
        }

        toast.success(newVoted ? 'Confirmed hazard! Upvote recorded.' : 'Upvote removed.');

        try {
            // Attempt API call if authenticated
            await fetch(`/api/potholes/${markerId}/votes`, {
                method: 'POST',
            });
        } catch {
            // Silently continue for demo/offline resilience
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            {/* Top Navigation Header */}
            <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Logo className="h-7" />
                    </Link>
                    <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-0.5 text-xs font-medium md:flex">
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                        </span>
                        <span className="text-foreground/80 font-mono text-[11px]">Vector Map Live</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        variant={showSidebar ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="gap-1.5 h-8 text-xs font-medium"
                    >
                        <ListFilter className="size-3.5" />
                        <span className="hidden sm:inline">{showSidebar ? 'Hide List' : 'Show List'}</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setIsReportOpen(true)}
                        className="gap-1.5 h-8 shadow-sm bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        <PlusCircle className="size-3.5" />
                        <span className="hidden sm:inline">Report Pothole</span>
                        <span className="sm:hidden">Report</span>
                    </Button>

                    <NotificationBell className="size-8" />

                    <ThemeToggle />

                    {session?.user ? (
                        <DropdownMenuAvatar imageUrl={session.user.image} name={session.user.name} />
                    ) : (
                        <Button asChild variant="outline" size="sm" className="h-8">
                            <Link href="/auth/login">Login</Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative flex flex-1 overflow-hidden">
                {/* Collapsible List Sidebar */}
                {showSidebar && (
                    <aside className="z-20 flex w-80 shrink-0 flex-col border-r bg-background/95 backdrop-blur-md transition-all duration-300 sm:w-96">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Nearby Hazards</span>
                                <Badge variant="secondary" className="text-xs">
                                    {filteredMarkers.length}
                                </Badge>
                            </div>
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* List Items */}
                        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                            {filteredMarkers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <AlertTriangle className="size-8 opacity-40 mb-2" />
                                    <p className="text-sm font-medium">No potholes found</p>
                                    <p className="text-xs">Try adjusting your filters</p>
                                </div>
                            ) : (
                                filteredMarkers.map((m) => {
                                    const status = STATUS_COLORS[m.status] || STATUS_COLORS.PENDING;
                                    const isSelected = selectedMarker?.id === m.id;

                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => handleSelectMarker(m)}
                                            className={`group relative flex cursor-pointer gap-3 p-3.5 transition-colors hover:bg-accent/40 ${
                                                isSelected ? 'bg-accent/60 ring-1 ring-primary/20' : ''
                                            }`}
                                        >
                                            {m.imageUrl ? (
                                                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={m.imageUrl}
                                                        alt={m.title || 'Pothole'}
                                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                                                    <MapPin className="size-6 text-muted-foreground/60" />
                                                </div>
                                            )}

                                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className="size-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: status.hex }}
                                                        />
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                            {m.status.replace('_', ' ')}
                                                        </span>
                                                        {m.severity === 'HIGH' && (
                                                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                                                                • HIGH
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="mt-0.5 font-medium text-xs text-foreground line-clamp-1 group-hover:text-primary">
                                                        {m.title}
                                                    </h4>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                        {m.description}
                                                    </p>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-[11px]">
                                                    <button
                                                        onClick={(e) => handleUpvote(m.id, e)}
                                                        className={`flex items-center gap-1 font-medium transition-colors ${
                                                            userVotes[m.id]
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    >
                                                        <ThumbsUp className="size-3" />
                                                        <span>{m.upvotesCount || 0}</span>
                                                    </button>
                                                    <span className="flex items-center gap-0.5 text-muted-foreground font-mono text-[10px]">
                                                        Fly to pin
                                                        <ChevronRight className="size-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </aside>
                )}

                {/* Map View Port */}
                <div className="relative flex-1">
                    <MapView
                        ref={mapRef}
                        markers={filteredMarkers}
                        selectedMarkerId={selectedMarker?.id}
                        onMarkerClick={handleSelectMarker}
                        className="h-full w-full rounded-none border-none"
                        showControls={true}
                    />

                    {/* Top Floating Filter & Search Bar */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none sm:left-6 sm:right-auto max-w-4xl">
                        {/* Search Input Box */}
                        <div className="pointer-events-auto flex items-center rounded-xl border bg-background/95 px-3 py-1.5 shadow-lg backdrop-blur-md sm:w-64">
                            <Search className="size-3.5 text-muted-foreground shrink-0" />
                            <Input
                                type="text"
                                placeholder="Search road or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-6 border-none bg-transparent px-2 text-xs focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/70"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>

                        {/* Status Pills */}
                        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur-md">
                            {STATUS_FILTERS.map((f) => (
                                <Button
                                    key={f.value}
                                    size="xs"
                                    variant={activeStatus === f.value ? 'default' : 'ghost'}
                                    onClick={() => setActiveStatus(f.value)}
                                    className="h-7 rounded-lg text-[11px] font-medium px-2.5"
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </div>

                        {/* Locate Me Floating Action */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleLocateMe}
                            disabled={isLocating}
                            className="pointer-events-auto size-9 rounded-xl border bg-background/95 shadow-lg backdrop-blur-md hover:bg-accent"
                            title="Center on my location"
                        >
                            <Navigation className={`size-4 text-primary ${isLocating ? 'animate-spin' : ''}`} />
                        </Button>

                        {/* Hazards Counter Badge */}
                        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 rounded-xl border bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-md text-xs">
                            <span className="font-semibold text-primary">{filteredMarkers.length}</span>
                            <span className="text-muted-foreground">hazards mapped</span>
                        </div>
                    </div>

                    {/* Bottom Status Legend */}
                    <div className="absolute bottom-6 left-4 z-10 hidden rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur-md sm:left-6 lg:block">
                        <div className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="size-3" />
                            <span>Lifecycle State</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {Object.entries(STATUS_COLORS)
                                .slice(0, 6)
                                .map(([status, config]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-full" style={{ backgroundColor: config.hex }} />
                                        <span className="capitalize text-xs text-foreground/90 font-medium">
                                            {status.toLowerCase().replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Selected Pothole Preview Card */}
                    {selectedMarker && (
                        <div className="absolute bottom-6 right-4 left-4 z-30 mx-auto max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-200 sm:right-6 sm:left-auto sm:w-96">
                            <Card className="border-border/80 bg-background/98 shadow-2xl backdrop-blur-xl">
                                <CardHeader className="relative pb-2">
                                    <button
                                        onClick={() => setSelectedMarker(null)}
                                        className="absolute top-3.5 right-3.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                        aria-label="Close card"
                                    >
                                        <X className="size-4" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={`font-semibold uppercase text-[10px] ${
                                                STATUS_COLORS[selectedMarker.status]?.bg || ''
                                            } ${STATUS_COLORS[selectedMarker.status]?.text || ''} ${
                                                STATUS_COLORS[selectedMarker.status]?.border || ''
                                            }`}
                                            variant="outline"
                                        >
                                            {selectedMarker.status.replace('_', ' ')}
                                        </Badge>

                                        {selectedMarker.severity && (
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] font-semibold ${
                                                    selectedMarker.severity === 'HIGH'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                                        : selectedMarker.severity === 'MEDIUM'
                                                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                                                }`}
                                            >
                                                {selectedMarker.severity} Severity
                                            </Badge>
                                        )}
                                    </div>

                                    <CardTitle className="pt-2 text-base font-semibold leading-tight text-foreground">
                                        {selectedMarker.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                                        {selectedMarker.description}
                                    </CardDescription>
                                </CardHeader>

                                {selectedMarker.imageUrl && (
                                    <div className="relative mx-6 h-40 overflow-hidden rounded-lg border bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={selectedMarker.imageUrl}
                                            alt={selectedMarker.title || 'Pothole'}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 rounded-md bg-zinc-950/70 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs">
                                            {selectedMarker.latitude.toFixed(4)}, {selectedMarker.longitude.toFixed(4)}
                                        </div>
                                    </div>
                                )}

                                <CardFooter className="flex items-center justify-between pt-3 pb-4 gap-2 flex-wrap">
                                    <UpvoteButton
                                        potholeId={selectedMarker.id}
                                        initialVotesCount={selectedMarker.upvotesCount || 0}
                                        size="sm"
                                    />

                                    <div className="flex items-center gap-1.5">
                                        <ShareDialog
                                            pothole={{
                                                id: selectedMarker.id,
                                                title: selectedMarker.title || 'Road Hazard',
                                                city: (selectedMarker as any).city || null,
                                                severity: selectedMarker.severity,
                                                status: selectedMarker.status,
                                            }}
                                            size="sm"
                                            showLabel={false}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setInspectingPotholeId(selectedMarker.id)}
                                            className="gap-1 text-xs h-8 font-medium"
                                        >
                                            <span>Inspect</span>
                                            <ArrowUpRight className="size-3.5" />
                                        </Button>
                                        <Button
                                            asChild
                                            size="icon"
                                            variant="ghost"
                                            className="size-8 text-muted-foreground hover:text-foreground"
                                            title="Open standalone page"
                                        >
                                            <Link href={`/potholes/${selectedMarker.id}`}>
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                    {/* Mobile & Desktop Floating Action Button */}
                    <ReportFAB onClick={() => setIsReportOpen(true)} />

                    {/* Report Hazard Modal Flow */}
                    <ReportModal
                        open={isReportOpen}
                        onOpenChange={setIsReportOpen}
                        onReportCreated={handleReportCreated}
                    />

                    {/* Detailed Pothole Inspection Modal */}
                    <PotholeDetailModal
                        open={Boolean(inspectingPotholeId)}
                        onOpenChange={(open) => !open && setInspectingPotholeId(null)}
                        potholeId={inspectingPotholeId}
                    />
                </div>
            </div>
        </div>
    );
}
