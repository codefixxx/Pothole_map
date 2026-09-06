'use client';

import React, { useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
    MapPin,
    Navigation,
    Building2,
    Check,
    Copy,
    AlertTriangle,
    Shield,
    User,
    Calendar,
    Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

interface PotholeMetaProps {
    municipality?: {
        id: string;
        name: string;
    } | null;
    latitude: number;
    longitude: number;
    locationAccuracy?: number | null;
    locationSource?: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    severity?: number | string;
    user?: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    } | null;
    assignedOfficer?: {
        id: string;
        name: string;
        image?: string | null;
    } | null;
    createdAt?: string | Date;
    className?: string;
}

export function PotholeMeta({
    municipality,
    latitude,
    longitude,
    locationAccuracy,
    locationSource = 'GPS',
    city,
    state,
    country = 'India',
    severity = 3,
    user,
    assignedOfficer,
    createdAt,
    className,
}: PotholeMetaProps) {
    const [copied, setCopied] = useState(false);

    // Severity mapping (1-10 or 'HIGH' | 'MEDIUM' | 'LOW')
    const numericSeverity = typeof severity === 'number' ? severity : severity === 'HIGH' ? 8 : severity === 'MEDIUM' ? 5 : 2;
    const severityLabel = numericSeverity >= 7 ? 'HIGH' : numericSeverity >= 4 ? 'MEDIUM' : 'LOW';

    const copyCoords = () => {
        const text = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Coordinates copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    const formattedTime = createdAt
        ? new Date(createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
            {/* Jurisdictional Routing Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-primary" />
                            Jurisdiction Routing
                        </span>
                        {municipality ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                                Assigned
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-[10px]">
                                Unassigned Queue
                            </Badge>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                            {municipality?.name || 'Pending PostGIS Jurisdiction Resolution'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {municipality
                                ? 'Report automatically routed to local municipal maintenance department.'
                                : 'Awaiting jurisdictional polygon mapping review.'}
                        </p>
                    </div>

                    {assignedOfficer && (
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Assigned Officer:</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                                <Shield className="size-3 text-primary" />
                                {assignedOfficer.name}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Geolocation & Precision Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="size-3.5 text-primary" />
                            Geolocation & Fix
                        </span>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="outline"
                                className="font-mono text-[10px] bg-muted/50 border-border/70"
                            >
                                {locationSource === 'MANUAL_ADJUSTMENT' ? 'Manual Pin' : 'GPS Fix'}
                            </Badge>
                            {locationAccuracy && (
                                <Badge variant="secondary" className="font-mono text-[10px]">
                                    ±{Math.round(locationAccuracy)}m
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-mono text-xs font-semibold text-foreground">
                                {latitude.toFixed(5)}, {longitude.toFixed(5)}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {[city, state, country].filter(Boolean).join(', ') || 'Coordinates locked on vector map'}
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={copyCoords}
                            className="size-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
                            title="Copy coordinates"
                        >
                            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Severity & Impact Rating Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="size-3.5 text-amber-500" />
                            Road Hazard Severity
                        </span>
                        <Badge
                            className={cn(
                                'text-[10px] font-bold uppercase tracking-wider',
                                severityLabel === 'HIGH'
                                    ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                                    : severityLabel === 'MEDIUM'
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                      : 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border border-zinc-500/30'
                            )}
                        >
                            {severityLabel} Priority
                        </Badge>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Impact Score</span>
                            <span className="font-semibold text-foreground font-mono">
                                {numericSeverity} / 10
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    'h-full transition-all duration-500 rounded-full',
                                    severityLabel === 'HIGH'
                                        ? 'bg-red-500'
                                        : severityLabel === 'MEDIUM'
                                          ? 'bg-amber-500'
                                          : 'bg-zinc-500'
                                )}
                                style={{ width: `${Math.min(100, Math.max(10, numericSeverity * 10))}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reporter Information Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <User className="size-3.5 text-primary" />
                            Citizen Reporter
                        </span>
                        {formattedDate && (
                            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formattedDate}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border/80">
                            <AvatarImage src={user?.image || undefined} alt={user?.name || 'Reporter'} />
                            <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                                {user?.name
                                    ? user.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                    : 'CR'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs text-foreground truncate">
                                {user?.name || 'Verified Citizen'}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {formattedTime ? `Report logged at ${formattedTime}` : 'Civic contributor'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
