'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { CitizenStats, CitizenStatsData } from './citizen-stats';
import { PotholeCard, DashboardPotholeItem } from './pothole-card';
import { PotholeDetailModal } from '@/src/components/pothole-detail/pothole-detail-modal';
import { ReportModal } from '@/src/components/report/report-modal';
import {
    PlusCircle,
    MapPin,
    Search,
    SlidersHorizontal,
    UserRound,
    Shield,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    ThumbsUp,
    Bell,
    ExternalLink,
    RefreshCw,
    Loader2,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export interface CitizenDashboardData {
    stats: CitizenStatsData;
    myReports: DashboardPotholeItem[];
    upvotedPotholes: DashboardPotholeItem[];
    followedReports: DashboardPotholeItem[];
    isDemoData?: boolean;
    user: {
        id: string;
        name?: string | null;
        email: string;
        image?: string | null;
        role: string;
        createdAt?: string;
    };
}

interface CitizenDashboardViewProps {
    initialData?: CitizenDashboardData;
}

export function CitizenDashboardView({ initialData }: CitizenDashboardViewProps) {
    const [data, setData] = useState<CitizenDashboardData | null>(initialData || null);
    const [isLoading, setIsLoading] = useState<boolean>(!initialData);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const [activeTab, setActiveTab] = useState<'my-reports' | 'upvoted' | 'followed'>('my-reports');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [inspectingPotholeId, setInspectingPotholeId] = useState<string | null>(null);
    const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

    // Fetch user activity
    const fetchActivity = async (showToast = false) => {
        try {
            if (showToast) setIsRefreshing(true);
            const isDemoQuery = typeof window !== 'undefined' && window.location.search.includes('demo=true');
            const res = await fetch(`/api/user/activity${isDemoQuery ? '?demo=true' : ''}`);
            if (!res.ok) throw new Error('Failed to load civic activity');
            const json = await res.json();
            if (json.success && json.data) {
                setData(json.data);
                if (showToast) toast.success('Civic activity refreshed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error fetching activity');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!initialData) {
            fetchActivity();
        }
    }, [initialData]);

    // Current tab items list
    const currentList = useMemo(() => {
        if (!data) return [];
        switch (activeTab) {
            case 'my-reports':
                return data.myReports || [];
            case 'upvoted':
                return data.upvotedPotholes || [];
            case 'followed':
                return data.followedReports || [];
            default:
                return [];
        }
    }, [data, activeTab]);

    // Filter items by search query & status
    const filteredList = useMemo(() => {
        return currentList.filter((item) => {
            const matchesSearch =
                searchQuery.trim() === '' ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.municipality?.name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [currentList, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your civic activity dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-center">
                <AlertTriangle className="size-8 text-amber-500" />
                <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
                <Button onClick={() => fetchActivity(true)} size="sm">
                    Retry
                </Button>
            </div>
        );
    }

    const initials = (data.user.name || 'User')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="space-y-8 pb-16">
            {/* Demo Data Notice Banner */}
            {data.isDemoData && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-foreground/90">
                        <Sparkles className="size-4 text-primary shrink-0" />
                        <span>
                            <strong>Civic Activity Preview:</strong> Showing sample road hazard reports to preview your dashboard. File a hazard or confirm reports on the live map to populate your records!
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsReportOpen(true)}
                        className="h-7 text-xs shrink-0 font-medium"
                    >
                        Report a Hazard
                    </Button>
                </div>
            )}

            {/* Profile Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-4">
                    <Avatar className="size-14 sm:size-16 border-2 border-border/80 shadow-xs">
                        <AvatarImage src={data.user.image || undefined} alt={data.user.name || 'User'} />
                        <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {data.user.name || 'Citizen Contributor'}
                            </h1>
                            <Badge variant="outline" className="text-xs font-normal border-primary/30 bg-primary/5 text-primary">
                                {data.user.role === 'ADMIN' ? 'Platform Administrator' : 'Citizen Contributor'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.user.email} • Tracking civic road infrastructure & municipal action
                        </p>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchActivity(true)}
                        disabled={isRefreshing}
                        className="gap-1.5 h-9 text-xs"
                        title="Refresh activity"
                    >
                        <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-9 text-xs"
                    >
                        <Link href="/map">
                            <MapPin className="size-3.5 text-primary" />
                            <span>Live Map</span>
                        </Link>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsReportOpen(true)}
                        className="gap-1.5 h-9 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    >
                        <PlusCircle className="size-3.5" />
                        <span>Report Hazard</span>
                    </Button>

                    {data.user.role === 'ADMIN' && (
                        <Button asChild size="sm" variant="secondary" className="gap-1.5 h-9 text-xs">
                            <Link href="/admin/dashboard">
                                <Shield className="size-3.5" />
                                <span>Admin</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Impact Metrics Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        Personal Civic Impact
                    </h2>
                </div>
                <CitizenStats stats={data.stats} />
            </div>

            {/* Civic Activity Tabs */}
            <div className="space-y-4">
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as any)}
                    className="w-full space-y-4"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <TabsList className="bg-muted/60 p-1 h-9">
                            <TabsTrigger value="my-reports" className="text-xs gap-1.5 px-3">
                                <AlertTriangle className="size-3.5 text-amber-500" />
                                <span>My Reports</span>
                                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                                    {data.myReports.length}
                                </Badge>
                            </TabsTrigger>

                            <TabsTrigger value="upvoted" className="text-xs gap-1.5 px-3">
                                <ThumbsUp className="size-3.5 text-sky-500" />
                                <span>Upvoted Potholes</span>
                                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                                    {data.upvotedPotholes.length}
                                </Badge>
                            </TabsTrigger>

                            <TabsTrigger value="followed" className="text-xs gap-1.5 px-3">
                                <Bell className="size-3.5 text-purple-500" />
                                <span>Followed Reports</span>
                                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                                    {data.followedReports.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Search & Filter Bar */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-60">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Filter by title or city..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-muted/40"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-8 rounded-md border border-input bg-muted/40 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                aria-label="Filter by status"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="ONGOING">In Progress</option>
                                <option value="FIXED">Fixed</option>
                            </select>
                        </div>
                    </div>

                    {/* Tab Panels */}
                    <TabsContent value={activeTab} className="mt-0 outline-none">
                        {filteredList.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 text-center space-y-4">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    {activeTab === 'my-reports' ? (
                                        <AlertTriangle className="size-6 text-amber-500" />
                                    ) : activeTab === 'upvoted' ? (
                                        <ThumbsUp className="size-6 text-sky-500" />
                                    ) : (
                                        <Bell className="size-6 text-purple-500" />
                                    )}
                                </div>

                                <div className="space-y-1 max-w-sm mx-auto">
                                    <h3 className="font-semibold text-sm text-foreground">
                                        {searchQuery || statusFilter !== 'ALL'
                                            ? 'No matching reports found'
                                            : activeTab === 'my-reports'
                                              ? 'You have not reported any potholes yet'
                                              : activeTab === 'upvoted'
                                                ? 'You have not upvoted any reports yet'
                                                : 'You are not following any reports yet'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {searchQuery || statusFilter !== 'ALL'
                                            ? 'Try clearing your filters or searching for another keyword.'
                                            : activeTab === 'my-reports'
                                              ? 'Spot a road hazard? Use our report flow to notify local municipality teams.'
                                              : activeTab === 'upvoted'
                                                ? 'Browse the live map and confirm existing potholes to help triage priority.'
                                                : 'Follow reports to receive instant status transitions and repair milestones.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 pt-2">
                                    {searchQuery || statusFilter !== 'ALL' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setStatusFilter('ALL');
                                            }}
                                            className="text-xs h-8"
                                        >
                                            Clear Filters
                                        </Button>
                                    ) : activeTab === 'my-reports' ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setIsReportOpen(true)}
                                            className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            <PlusCircle className="size-3.5" />
                                            <span>Report First Hazard</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8 gap-1.5"
                                        >
                                            <Link href="/map">
                                                <MapPin className="size-3.5" />
                                                <span>Explore Live Map</span>
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredList.map((pothole) => (
                                    <PotholeCard
                                        key={pothole.id}
                                        pothole={pothole}
                                        category={activeTab}
                                        onInspect={(id) => setInspectingPotholeId(id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Quick Inspect Modal */}
            <PotholeDetailModal
                potholeId={inspectingPotholeId}
                open={!!inspectingPotholeId}
                onOpenChange={(open) => {
                    if (!open) setInspectingPotholeId(null);
                }}
            />

            {/* Report Hazard Modal Trigger */}
            <ReportModal
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
            />
        </div>
    );
}
