'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/src/components/layout/logo';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';
import { DropdownMenuAvatar } from '@/src/components/layout/dropdown-menu-avatar';
import { NotificationBell } from '@/src/components/notifications';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
    Building2,
    Shield,
    MapPin,
    Clock,
    ShieldCheck,
    Wrench,
    CheckCircle2,
    Home,
    ChevronRight,
    Compass,
} from 'lucide-react';
import { MunicipalityInfo, TriagePotholeItem } from './types';

interface MunicipalityHeaderProps {
    municipality: MunicipalityInfo;
    potholes: TriagePotholeItem[];
    userRole?: string;
    userName?: string;
    userImage?: string | null;
}

export function MunicipalityHeader({
    municipality,
    potholes,
    userRole = 'OFFICER',
    userName,
    userImage,
}: MunicipalityHeaderProps) {
    const totalCount = potholes.length;
    const pendingCount = potholes.filter((p) => p.status === 'PENDING').length;
    const verifiedCount = potholes.filter((p) => p.status === 'VERIFIED').length;
    const ongoingCount = potholes.filter((p) => p.status === 'ONGOING').length;
    const fixedCount = potholes.filter((p) => p.status === 'FIXED').length;

    return (
        <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Left: Brand & Municipality Identity */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Logo className="h-7" />
                        </Link>
                        <div className="h-5 w-px bg-border/80 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Building2 className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                                    {municipality.name}
                                </h1>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                    {municipality.code || 'MUNICIPAL PORTAL'} • JURISDICTION ACTIVE
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge
                            variant="secondary"
                            className="hidden sm:inline-flex gap-1 text-[11px] font-semibold bg-primary/10 text-primary border-primary/25"
                        >
                            <Shield className="size-3" />
                            <span>Role: {userRole}</span>
                        </Badge>

                        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex gap-1.5 h-8 text-xs font-medium">
                            <Link href="/map">
                                <Compass className="size-3.5 text-primary" />
                                <span>Public Vector Map</span>
                            </Link>
                        </Button>

                        <NotificationBell className="size-8" />
                        <ThemeToggle />
                        <DropdownMenuAvatar name={userName} imageUrl={userImage} />
                    </div>
                </div>
            </div>

            {/* Sub-bar: Breadcrumbs & Quick KPI Metrics */}
            <div className="border-t border-border/60 bg-muted/20">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Home className="size-3.5" />
                            <span>Home</span>
                        </Link>
                        <ChevronRight className="size-3" />
                        <span className="text-muted-foreground">Municipality</span>
                        <ChevronRight className="size-3" />
                        <span className="font-semibold text-foreground">Officer Triage Queue</span>
                    </nav>

                    {/* KPI Quick Stat Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border/70 text-xs shadow-2xs">
                            <span className="text-[11px] text-muted-foreground">Queue:</span>
                            <span className="font-bold text-foreground">{totalCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-400">
                            <Clock className="size-3" />
                            <span className="text-[11px]">Pending:</span>
                            <span className="font-bold">{pendingCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-700 dark:text-indigo-400">
                            <ShieldCheck className="size-3" />
                            <span className="text-[11px]">Verified:</span>
                            <span className="font-bold">{verifiedCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/25 text-xs text-sky-700 dark:text-sky-400">
                            <Wrench className="size-3" />
                            <span className="text-[11px]">Ongoing:</span>
                            <span className="font-bold">{ongoingCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            <span className="text-[11px]">Fixed:</span>
                            <span className="font-bold">{fixedCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
