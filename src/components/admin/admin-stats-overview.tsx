'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import {
    Activity,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Users,
    ShieldAlert,
    TrendingUp,
    MapPin,
    Clock,
} from 'lucide-react';

export interface AdminStats {
    totalPotholes: number;
    pendingCount: number;
    verifiedCount: number;
    ongoingCount: number;
    fixedCount: number;
    rejectedCount: number;
    escalatedCount: number;
    totalMunicipalities: number;
    totalUsers: number;
    totalStaff: number;
    jurisdictionCount: number;
    resolutionRate: number;
}

interface AdminStatsOverviewProps {
    stats: AdminStats | null;
    isLoading?: boolean;
}

export function AdminStatsOverview({ stats, isLoading }: AdminStatsOverviewProps) {
    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 w-24 rounded bg-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 rounded bg-muted" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 bg-card/60 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Reports
                        </CardTitle>
                        <Activity className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPotholes}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{stats.pendingCount} pending triage</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 bg-card/60 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Resolution Rate
                        </CardTitle>
                        <TrendingUp className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolutionRate}%</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="size-3" />
                            <span>{stats.fixedCount} resolved issues</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 bg-card/60 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Municipal Coverage
                        </CardTitle>
                        <Building2 className="size-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMunicipalities}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3 text-purple-500" />
                            <span>{stats.jurisdictionCount} active jurisdictions</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-card/60 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Platform Staff
                        </CardTitle>
                        <Users className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStaff}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Across {stats.totalUsers} registered citizens</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Breakdown & Escalation Notice */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="size-4 text-primary" />
                            Pothole Lifecycle Breakdown
                        </CardTitle>
                        <CardDescription>
                            Distribution of reports across state machine workflow stages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Custom Stacked Progress Bar */}
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
                            <div
                                style={{ width: `${stats.totalPotholes > 0 ? (stats.pendingCount / stats.totalPotholes) * 100 : 0}%` }}
                                className="bg-amber-500 h-full transition-all"
                                title={`Pending: ${stats.pendingCount}`}
                            />
                            <div
                                style={{ width: `${stats.totalPotholes > 0 ? (stats.verifiedCount / stats.totalPotholes) * 100 : 0}%` }}
                                className="bg-purple-500 h-full transition-all"
                                title={`Verified: ${stats.verifiedCount}`}
                            />
                            <div
                                style={{ width: `${stats.totalPotholes > 0 ? (stats.ongoingCount / stats.totalPotholes) * 100 : 0}%` }}
                                className="bg-indigo-500 h-full transition-all"
                                title={`Ongoing: ${stats.ongoingCount}`}
                            />
                            <div
                                style={{ width: `${stats.totalPotholes > 0 ? (stats.fixedCount / stats.totalPotholes) * 100 : 0}%` }}
                                className="bg-emerald-500 h-full transition-all"
                                title={`Fixed: ${stats.fixedCount}`}
                            />
                            <div
                                style={{ width: `${stats.totalPotholes > 0 ? (stats.rejectedCount / stats.totalPotholes) * 100 : 0}%` }}
                                className="bg-zinc-400 h-full transition-all"
                                title={`Rejected: ${stats.rejectedCount}`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-xs">
                            <div className="flex items-center gap-2 rounded-lg border p-2.5">
                                <span className="size-2.5 rounded-full bg-amber-500" />
                                <div>
                                    <p className="font-semibold">{stats.pendingCount}</p>
                                    <p className="text-muted-foreground">Pending</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-2.5">
                                <span className="size-2.5 rounded-full bg-purple-500" />
                                <div>
                                    <p className="font-semibold">{stats.verifiedCount}</p>
                                    <p className="text-muted-foreground">Verified</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-2.5">
                                <span className="size-2.5 rounded-full bg-indigo-500" />
                                <div>
                                    <p className="font-semibold">{stats.ongoingCount}</p>
                                    <p className="text-muted-foreground">In Progress</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-2.5">
                                <span className="size-2.5 rounded-full bg-emerald-500" />
                                <div>
                                    <p className="font-semibold">{stats.fixedCount}</p>
                                    <p className="text-muted-foreground">Resolved</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-2.5">
                                <span className="size-2.5 rounded-full bg-zinc-400" />
                                <div>
                                    <p className="font-semibold">{stats.rejectedCount}</p>
                                    <p className="text-muted-foreground">Rejected</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Escalated Issues Card */}
                <Card className={stats.escalatedCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : ''}>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ShieldAlert className="size-4 text-amber-500" />
                                Escalation Alert
                            </span>
                            <Badge variant={stats.escalatedCount > 0 ? 'destructive' : 'secondary'}>
                                {stats.escalatedCount} Active
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Reports unaddressed past SLA guidelines
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.escalatedCount > 0 ? (
                            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-medium">
                                        {stats.escalatedCount} report(s) flagged for manager review.
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        Automated background escalation trigger identified reports pending over threshold SLA limit.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center text-xs text-muted-foreground">
                                <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
                                <p className="font-medium">All SLA Timelines Healthy</p>
                                <p>No reports currently exceeding resolution deadlines.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
