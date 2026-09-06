'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { LifecycleStepper } from './lifecycle-stepper';
import { PotholeGallery } from './pothole-gallery';
import { PotholeMeta } from './pothole-meta';
import { MapView } from '@/src/components/map/map-view';
import { STATUS_COLORS, MapMarkerItem } from '@/src/lib/map-config';
import {
    UpvoteButton,
    FollowButton,
    ShareDialog,
    CommentThread,
} from '@/src/components/social';
import {
    MapPin,
    ExternalLink,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface PotholeDetailData {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    locationAccuracy?: number | null;
    locationSource?: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    imageUrl?: string | null;
    fixedImageUrl?: string | null;
    status: string;
    severity?: number | string;
    verifiedAt?: string | Date | null;
    fixedAt?: string | Date | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    user?: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    } | null;
    municipality?: {
        id: string;
        name: string;
    } | null;
    assignedOfficer?: {
        id: string;
        name: string;
        image?: string | null;
    } | null;
    statusHistories?: any[];
    votes?: any[];
    comments?: any[];
}

interface PotholeDetailViewProps {
    pothole: PotholeDetailData;
    layout?: 'page' | 'modal';
    onClose?: () => void;
    className?: string;
}

export function PotholeDetailView({
    pothole,
    layout = 'page',
    onClose,
    className,
}: PotholeDetailViewProps) {
    const isFixed = pothole.status === 'FIXED' || pothole.status === 'RESOLVED';
    const statusConfig = STATUS_COLORS[pothole.status] || STATUS_COLORS.PENDING;

    const mapMarker: MapMarkerItem = {
        id: pothole.id,
        latitude: pothole.latitude,
        longitude: pothole.longitude,
        title: pothole.title,
        status: pothole.status as any,
        severity: (typeof pothole.severity === 'string'
            ? pothole.severity
            : (pothole.severity || 3) >= 7
              ? 'HIGH'
              : (pothole.severity || 3) >= 4
                ? 'MEDIUM'
                : 'LOW') as any,
        imageUrl: pothole.imageUrl || undefined,
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header / Title Area */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-xs font-semibold uppercase tracking-wider py-0.5 px-2.5',
                                statusConfig.bg,
                                statusConfig.text,
                                statusConfig.border
                            )}
                        >
                            {pothole.status.replace('_', ' ')}
                        </Badge>

                        {isFixed && (
                            <Badge className="bg-emerald-600 text-white text-xs gap-1 font-medium">
                                <CheckCircle2 className="size-3" />
                                Repair Complete
                            </Badge>
                        )}

                        <span className="text-xs text-muted-foreground font-mono">
                            Report #{pothole.id.slice(-6).toUpperCase()}
                        </span>
                    </div>

                    {/* Social Action Bar: Upvote, Follow, Share, Open Page */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <UpvoteButton
                            potholeId={pothole.id}
                            initialVotesCount={pothole.votes?.length || 0}
                            size="sm"
                        />

                        <FollowButton
                            potholeId={pothole.id}
                            size="sm"
                        />

                        <ShareDialog
                            pothole={{
                                id: pothole.id,
                                title: pothole.title,
                                city: pothole.city,
                                severity: pothole.severity,
                                status: pothole.status,
                            }}
                            size="sm"
                        />

                        {layout === 'modal' && (
                            <Button asChild size="sm" variant="secondary" className="gap-1 h-8 text-xs">
                                <Link href={`/potholes/${pothole.id}`}>
                                    <span>Open Page</span>
                                    <ExternalLink className="size-3" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {pothole.title}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {pothole.description}
                    </p>
                </div>
            </div>

            {/* Lifecycle State Machine Stepper */}
            <Card className="border-border/70 bg-card/60 backdrop-blur-xs">
                <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Clock className="size-4 text-primary" />
                            Report Lifecycle Progression
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            State Machine Verified
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6">
                    <LifecycleStepper
                        currentStatus={pothole.status}
                        statusHistories={pothole.statusHistories}
                        createdAt={pothole.createdAt}
                        verifiedAt={pothole.verifiedAt}
                        fixedAt={pothole.fixedAt}
                    />
                </CardContent>
            </Card>

            {/* Photo Gallery & Comparison */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider text-xs">
                    Hazard Visual Documentation
                </h3>
                <PotholeGallery
                    imageUrl={pothole.imageUrl}
                    fixedImageUrl={pothole.fixedImageUrl}
                    title={pothole.title}
                    isFixed={isFixed}
                />
            </div>

            {/* Metadata & Routing Grid */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider text-xs">
                    Civic Governance & Geographic Metadata
                </h3>
                <PotholeMeta
                    municipality={pothole.municipality}
                    latitude={pothole.latitude}
                    longitude={pothole.longitude}
                    locationAccuracy={pothole.locationAccuracy}
                    locationSource={pothole.locationSource}
                    city={pothole.city}
                    state={pothole.state}
                    country={pothole.country}
                    severity={pothole.severity}
                    user={pothole.user}
                    assignedOfficer={pothole.assignedOfficer}
                    createdAt={pothole.createdAt}
                />
            </div>

            {/* Mini Vector Map Location Context */}
            <Card className="overflow-hidden border-border/70 bg-card/60">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary" />
                            Location Mapping Context
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Centered on exact GPS lock ({pothole.latitude.toFixed(4)}, {pothole.longitude.toFixed(4)})
                        </CardDescription>
                    </div>

                    <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Link href={`/map?lat=${pothole.latitude}&lng=${pothole.longitude}`}>
                            <span>Open in Full Live Map</span>
                            <ExternalLink className="size-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="h-48 w-full overflow-hidden rounded-lg border border-border/60">
                        <MapView
                            center={[pothole.longitude, pothole.latitude]}
                            zoom={15.5}
                            markers={[mapMarker]}
                            selectedMarkerId={pothole.id}
                            showControls={false}
                            className="h-full w-full min-h-0 rounded-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Civic Discussion & Community Updates */}
            <CommentThread
                potholeId={pothole.id}
                initialComments={pothole.comments || []}
                reporterId={pothole.user?.id}
            />
        </div>
    );
}
