'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { STATUS_COLORS } from '@/src/lib/map-config';
import { formatRelativeTime, cn } from '@/src/lib/utils';
import { ShareDialog } from '@/src/components/social/share-dialog';
import { UpvoteButton } from '@/src/components/social/upvote-button';
import { FollowButton } from '@/src/components/social/follow-button';
import {
    MapPin,
    Calendar,
    MessageSquare,
    ExternalLink,
    ArrowUpRight,
    CheckCircle2,
    Building2,
} from 'lucide-react';

export interface DashboardPotholeItem {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    city?: string | null;
    state?: string | null;
    status: string;
    severity?: number | string;
    imageUrl?: string | null;
    createdAt: string | Date;
    updatedAt?: string | Date;
    municipality?: {
        id: string;
        name: string;
    } | null;
    votesCount?: number;
    commentsCount?: number;
}

interface PotholeCardProps {
    pothole: DashboardPotholeItem;
    category: 'my-reports' | 'upvoted' | 'followed';
    onInspect?: (id: string) => void;
    className?: string;
}

export function PotholeCard({
    pothole,
    category,
    onInspect,
    className,
}: PotholeCardProps) {
    const statusConfig = STATUS_COLORS[pothole.status] || STATUS_COLORS.PENDING;
    const isFixed = pothole.status === 'FIXED' || pothole.status === 'RESOLVED';

    const severityNumber =
        typeof pothole.severity === 'number'
            ? pothole.severity
            : parseInt(pothole.severity as string, 10) || 3;

    return (
        <Card
            className={cn(
                'group relative flex flex-col justify-between overflow-hidden border border-border/70 bg-card/60 backdrop-blur-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md',
                className
            )}
        >
            <div>
                {/* Photo Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-muted/60 border-b border-border/60">
                    {pothole.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={pothole.imageUrl}
                            alt={pothole.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground text-xs font-mono">
                            No image provided
                        </div>
                    )}

                    {/* Status Badge overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider py-0.5 px-2 backdrop-blur-md shadow-xs',
                                statusConfig.bg,
                                statusConfig.text,
                                statusConfig.border
                            )}
                        >
                            {pothole.status.replace('_', ' ')}
                        </Badge>

                        {isFixed && (
                            <Badge className="bg-emerald-600 text-white text-[10px] py-0.5 px-1.5 gap-1 font-medium shadow-xs">
                                <CheckCircle2 className="size-2.5" />
                                Fixed
                            </Badge>
                        )}
                    </div>

                    {/* Severity Badge overlay */}
                    <div className="absolute top-2.5 right-2.5">
                        <Badge
                            variant="secondary"
                            className={cn(
                                'text-[10px] font-mono font-semibold py-0.5 px-1.5 backdrop-blur-md shadow-xs',
                                severityNumber >= 7
                                    ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30'
                                    : severityNumber >= 4
                                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                      : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-300 border border-zinc-500/30'
                            )}
                        >
                            Sev {severityNumber}/10
                        </Badge>
                    </div>

                    {/* Geolocation pill overlay */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-zinc-950/70 px-2 py-0.5 text-[10px] font-mono text-zinc-200 backdrop-blur-xs">
                        <MapPin className="size-2.5 text-primary" />
                        <span>{pothole.city || 'Road Hazard'}</span>
                    </div>
                </div>

                {/* Card Content Header */}
                <CardHeader className="p-4 pb-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-mono">#{pothole.id.slice(-6).toUpperCase()}</span>
                        <span>{formatRelativeTime(pothole.createdAt)}</span>
                    </div>

                    <h3 className="text-sm font-semibold leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {pothole.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {pothole.description}
                    </p>

                    {pothole.municipality && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/90 pt-1">
                            <Building2 className="size-3 text-primary/70 shrink-0" />
                            <span className="truncate">{pothole.municipality.name}</span>
                        </div>
                    )}
                </CardHeader>
            </div>

            {/* Card Footer: Metrics & Actions */}
            <CardFooter className="p-4 pt-2 flex flex-col space-y-3 border-t border-border/40">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{pothole.votesCount || 0}</span> Confirmations
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            <span className="font-semibold text-foreground">{pothole.commentsCount || 0}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {category === 'followed' && (
                            <FollowButton potholeId={pothole.id} initialFollowing size="sm" />
                        )}
                        {category === 'upvoted' && (
                            <UpvoteButton
                                potholeId={pothole.id}
                                initialVotesCount={pothole.votesCount || 0}
                                initialHasVoted
                                size="sm"
                                showLabel={false}
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 w-full pt-1">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onInspect?.(pothole.id)}
                        className="flex-1 gap-1 h-8 text-xs font-medium"
                    >
                        <span>Inspect</span>
                        <ArrowUpRight className="size-3" />
                    </Button>

                    <Button asChild variant="outline" size="sm" className="h-8 text-xs px-2.5" title="Open full page">
                        <Link href={`/potholes/${pothole.id}`}>
                            <ExternalLink className="size-3" />
                        </Link>
                    </Button>

                    <ShareDialog
                        pothole={{
                            id: pothole.id,
                            title: pothole.title,
                            city: pothole.city,
                            severity: pothole.severity,
                            status: pothole.status,
                        }}
                        size="sm"
                        showLabel={false}
                    />
                </div>
            </CardFooter>
        </Card>
    );
}
