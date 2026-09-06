'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { formatRelativeTime } from '@/src/lib/utils';
import { DuplicateCandidateItem, MunicipalStatus } from './types';
import {
    Sparkles,
    MapPin,
    Calendar,
    ThumbsUp,
    MessageSquare,
    GitMerge,
    XCircle,
    CheckCircle2,
    ExternalLink,
    AlertTriangle,
    Clock,
    ShieldCheck,
    Wrench,
    ArrowLeftRight,
    User,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface DuplicateComparisonModalProps {
    candidate: DuplicateCandidateItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolved?: (candidateId: string, resolution: 'CONFIRMED' | 'REJECTED') => void;
}

function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

function getStatusBadge(status: MunicipalStatus) {
    switch (status) {
        case 'PENDING':
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1">
                    <Clock className="size-3" />
                    <span>Pending</span>
                </Badge>
            );
        case 'VERIFIED':
            return (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] gap-1">
                    <ShieldCheck className="size-3" />
                    <span>Verified</span>
                </Badge>
            );
        case 'ONGOING':
            return (
                <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] gap-1">
                    <Wrench className="size-3" />
                    <span>Ongoing</span>
                </Badge>
            );
        case 'FIXED':
            return (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>Fixed</span>
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] gap-1">
                    <XCircle className="size-3" />
                    <span>Rejected</span>
                </Badge>
            );
    }
}

export function DuplicateComparisonModal({
    candidate,
    open,
    onOpenChange,
    onResolved,
}: DuplicateComparisonModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [actionType, setActionType] = useState<'CONFIRMED' | 'REJECTED' | null>(null);

    if (!candidate) return null;

    const { pothole: primary, duplicate } = candidate;

    const distance =
        candidate.distanceInMeters ??
        calculateDistanceInMeters(
            primary.latitude,
            primary.longitude,
            duplicate.latitude,
            duplicate.longitude
        );

    const confidencePct = Math.round(candidate.confidenceScore * 100);
    const visualPct = candidate.visualSimilarity
        ? Math.round(candidate.visualSimilarity * 100)
        : null;

    const totalCombinedVotes = (primary.votesCount || 0) + (duplicate.votesCount || 0);

    const handleResolve = async (status: 'CONFIRMED' | 'REJECTED') => {
        setSubmitting(true);
        setActionType(status);
        try {
            const res = await fetch(`/api/potholes/duplicates/${candidate.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to resolve duplicate relationship');
            }

            if (status === 'CONFIRMED') {
                toast.success('Duplicate confirmed & merged successfully', {
                    description: `Consolidated reports and combined ${totalCombinedVotes} citizen upvotes.`,
                });
            } else {
                toast.info('Candidate dismissed as false positive', {
                    description: 'Reports will remain independent in the triage queue.',
                });
            }

            onResolved?.(candidate.id, status);
            onOpenChange(false);
        } catch (error: any) {
            console.error('Resolve error:', error);
            toast.error('Resolution failed', {
                description: error.message || 'Could not resolve duplicate candidate. Please try again.',
            });
        } finally {
            setSubmitting(false);
            setActionType(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 gap-5">
                <DialogHeader className="space-y-1.5 pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <GitMerge className="size-4" />
                            </span>
                            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                                Duplicate Candidate Review
                            </DialogTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`gap-1.5 font-mono text-xs px-2.5 py-1 ${
                                    confidencePct >= 85
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                }`}
                            >
                                <Sparkles className="size-3.5" />
                                <span>{confidencePct}% Match Confidence</span>
                            </Badge>
                            <Badge variant="outline" className="gap-1 font-mono text-xs px-2.5 py-1 bg-muted/60">
                                <MapPin className="size-3 text-rose-500" />
                                <span>{distance}m apart</span>
                            </Badge>
                        </div>
                    </div>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Compare the existing primary report against the suspected duplicate. Confirming consolidates civic votes and closes the duplicate report.
                    </DialogDescription>
                </DialogHeader>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary / Original Report Card */}
                    <div className="flex flex-col border border-border/80 rounded-xl bg-card overflow-hidden shadow-2xs">
                        <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-primary" />
                                <span className="text-xs font-bold text-foreground">Primary / Original Report</span>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.2">
                                #{primary.id.slice(-6)}
                            </Badge>
                        </div>

                        {/* Photo Container */}
                        <div className="relative aspect-video w-full bg-muted/60 overflow-hidden border-b border-border/40">
                            {primary.imageUrl ? (
                                <Image
                                    src={primary.imageUrl}
                                    alt={primary.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-1 p-4">
                                    <AlertTriangle className="size-6 opacity-30" />
                                    <span className="text-xs">No image provided</span>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                                {getStatusBadge(primary.status)}
                                <Badge variant="outline" className="bg-background/90 backdrop-blur-xs text-[10px] font-bold">
                                    L{primary.severity} Severity
                                </Badge>
                            </div>
                        </div>

                        {/* Content Details */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                    {primary.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {primary.description || 'No detailed description provided.'}
                                </p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                    <span className="flex items-center gap-1">
                                        <User className="size-3 text-muted-foreground" />
                                        <span>{primary.user?.name || 'Anonymous Reporter'}</span>
                                    </span>
                                    <span className="flex items-center gap-1 font-mono">
                                        <Calendar className="size-3" />
                                        <span>{formatRelativeTime(primary.createdAt)}</span>
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                    <span className="flex items-center gap-1 font-mono">
                                        <MapPin className="size-3 text-rose-500" />
                                        <span>{primary.latitude.toFixed(4)}, {primary.longitude.toFixed(4)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 font-medium text-amber-500">
                                            <ThumbsUp className="size-3" />
                                            {primary.votesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="size-3" />
                                            {primary.commentsCount || 0}
                                        </span>
                                    </span>
                                </div>

                                <div className="pt-1">
                                    <Link
                                        href={`/potholes/${primary.id}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                    >
                                        <span>View full primary report</span>
                                        <ExternalLink className="size-2.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Duplicate Report Card */}
                    <div className="flex flex-col border border-amber-500/40 rounded-xl bg-card overflow-hidden shadow-2xs relative">
                        <div className="px-3.5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    Candidate Duplicate
                                </span>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.2 border-amber-500/40">
                                #{duplicate.id.slice(-6)}
                            </Badge>
                        </div>

                        {/* Photo Container */}
                        <div className="relative aspect-video w-full bg-muted/60 overflow-hidden border-b border-border/40">
                            {duplicate.imageUrl ? (
                                <Image
                                    src={duplicate.imageUrl}
                                    alt={duplicate.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-1 p-4">
                                    <AlertTriangle className="size-6 opacity-30" />
                                    <span className="text-xs">No image provided</span>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                                {getStatusBadge(duplicate.status)}
                                <Badge variant="outline" className="bg-background/90 backdrop-blur-xs text-[10px] font-bold">
                                    L{duplicate.severity} Severity
                                </Badge>
                            </div>
                        </div>

                        {/* Content Details */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                    {duplicate.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {duplicate.description || 'No detailed description provided.'}
                                </p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                    <span className="flex items-center gap-1">
                                        <User className="size-3 text-muted-foreground" />
                                        <span>{duplicate.user?.name || 'Anonymous Reporter'}</span>
                                    </span>
                                    <span className="flex items-center gap-1 font-mono">
                                        <Calendar className="size-3" />
                                        <span>{formatRelativeTime(duplicate.createdAt)}</span>
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                    <span className="flex items-center gap-1 font-mono">
                                        <MapPin className="size-3 text-rose-500" />
                                        <span>{duplicate.latitude.toFixed(4)}, {duplicate.longitude.toFixed(4)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 font-medium text-amber-500">
                                            <ThumbsUp className="size-3" />
                                            {duplicate.votesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="size-3" />
                                            {duplicate.commentsCount || 0}
                                        </span>
                                    </span>
                                </div>

                                <div className="pt-1">
                                    <Link
                                        href={`/potholes/${duplicate.id}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                    >
                                        <span>View full duplicate report</span>
                                        <ExternalLink className="size-2.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI & Spatial Similarity Breakdown Card */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-primary" />
                            <span>Detection Evidence Breakdown</span>
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                            Spatial + Neural Embeddings Match
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg border border-border/50 bg-card">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                GPS Distance
                            </div>
                            <div className="text-sm font-bold text-foreground mt-0.5 flex items-baseline gap-1">
                                <span>{distance} m</span>
                                <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                                    (Within 100m zone)
                                </span>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border/50 bg-card">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Visual Similarity
                            </div>
                            <div className="text-sm font-bold text-foreground mt-0.5 flex items-baseline gap-1">
                                <span>{visualPct !== null ? `${visualPct}%` : 'Pending AI Vector'}</span>
                                {visualPct !== null && (
                                    <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                                        (Cosine match)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border/50 bg-card">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Combined Civic Upvotes
                            </div>
                            <div className="text-sm font-bold text-foreground mt-0.5 flex items-baseline gap-1">
                                <span>{totalCombinedVotes} upvotes</span>
                                <span className="text-[10px] font-normal text-primary">
                                    (Will consolidate)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="text-xs"
                    >
                        Close
                    </Button>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        {/* Dismiss / False positive */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleResolve('REJECTED')}
                            className="w-full sm:w-auto text-xs gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                        >
                            <XCircle className="size-3.5" />
                            <span>{submitting && actionType === 'REJECTED' ? 'Dismissing...' : 'Dismiss as False Positive'}</span>
                        </Button>

                        {/* Confirm & Merge */}
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleResolve('CONFIRMED')}
                            className="w-full sm:w-auto text-xs gap-1.5 shadow-2xs"
                        >
                            <GitMerge className="size-3.5" />
                            <span>{submitting && actionType === 'CONFIRMED' ? 'Merging...' : 'Confirm & Merge Duplicate'}</span>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
