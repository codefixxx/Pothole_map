'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DuplicateCandidateItem } from './types';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { formatRelativeTime } from '@/src/lib/utils';
import {
    Sparkles,
    MapPin,
    GitMerge,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ThumbsUp,
    AlertTriangle,
    Clock,
    ShieldCheck,
    Layers,
    SlidersHorizontal,
    Search,
} from 'lucide-react';
import { Skeleton } from '@/src/components/ui/skeleton';

interface DuplicateCandidateQueueProps {
    candidates: DuplicateCandidateItem[];
    loading?: boolean;
    onReviewCandidate: (candidate: DuplicateCandidateItem) => void;
    onQuickResolve?: (candidateId: string, resolution: 'CONFIRMED' | 'REJECTED') => void;
}

export function DuplicateCandidateQueue({
    candidates,
    loading = false,
    onReviewCandidate,
    onQuickResolve,
}: DuplicateCandidateQueueProps) {
    const [minConfidence, setMinConfidence] = useState<number>(0);
    const [filterQuery, setFilterQuery] = useState('');

    const filteredCandidates = useMemo(() => {
        return candidates.filter((c) => {
            if (c.status !== 'POTENTIAL') return false;
            if (c.confidenceScore < minConfidence) return false;
            if (filterQuery.trim()) {
                const q = filterQuery.toLowerCase();
                const matchPrimary =
                    c.pothole.title.toLowerCase().includes(q) ||
                    (c.pothole.city && c.pothole.city.toLowerCase().includes(q));
                const matchDuplicate =
                    c.duplicate.title.toLowerCase().includes(q) ||
                    (c.duplicate.city && c.duplicate.city.toLowerCase().includes(q));
                return matchPrimary || matchDuplicate;
            }
            return true;
        });
    }, [candidates, minConfidence, filterQuery]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-xl bg-card space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter and Control Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card/60">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="size-4 text-primary" />
                        <span>Pending Candidate Pairs:</span>
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                        {filteredCandidates.length}
                    </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <SlidersHorizontal className="size-3.5" />
                        <span>Confidence:</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border/70 p-0.5 bg-muted/40">
                        {[
                            { label: 'All', value: 0 },
                            { label: '≥ 80%', value: 0.8 },
                            { label: '≥ 90%', value: 0.9 },
                        ].map((pill) => (
                            <button
                                key={pill.value}
                                onClick={() => setMinConfidence(pill.value)}
                                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                                    minConfidence === pill.value
                                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-card/40 space-y-3">
                    <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">No Pending Duplicates</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            All reported road hazards within this jurisdiction appear distinct and unique. New proximity or AI vector candidate detections will surface here.
                        </p>
                    </div>
                </div>
            ) : (
                /* List of Candidate Pairs */
                <div className="space-y-3.5">
                    {filteredCandidates.map((cand) => {
                        const confidencePct = Math.round(cand.confidenceScore * 100);
                        const distance = cand.distanceInMeters ?? 25;

                        return (
                            <div
                                key={cand.id}
                                className="group relative border border-border/80 hover:border-primary/50 transition-all duration-200 rounded-xl bg-card overflow-hidden shadow-2xs hover:shadow-xs p-4 space-y-3.5"
                            >
                                {/* Top Badges & Meta */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`gap-1 font-mono text-xs px-2 py-0.5 ${
                                                confidencePct >= 85
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                            }`}
                                        >
                                            <Sparkles className="size-3" />
                                            <span>{confidencePct}% Match Confidence</span>
                                        </Badge>

                                        <Badge variant="outline" className="gap-1 font-mono text-xs px-2 py-0.5 bg-muted/40">
                                            <MapPin className="size-3 text-rose-500" />
                                            <span>{distance}m apart</span>
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                                        <Clock className="size-3" />
                                        <span>Candidate flagged {formatRelativeTime(cand.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Paired Potholes Preview Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {/* Primary / Target Pothole */}
                                    <div className="flex gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                                        <div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-muted">
                                            {cand.pothole.imageUrl ? (
                                                <Image
                                                    src={cand.pothole.imageUrl}
                                                    alt={cand.pothole.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="size-full flex items-center justify-center text-muted-foreground">
                                                    <AlertTriangle className="size-4 opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                                    Primary Report
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    #{cand.pothole.id.slice(-6)}
                                                </span>
                                            </div>
                                            <h5 className="text-xs font-semibold text-foreground truncate">
                                                {cand.pothole.title}
                                            </h5>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span className="font-medium text-amber-500 flex items-center gap-0.5">
                                                    <ThumbsUp className="size-2.5" />
                                                    {cand.pothole.votesCount || 0}
                                                </span>
                                                <span>•</span>
                                                <span>L{cand.pothole.severity} Severity</span>
                                                <span>•</span>
                                                <span>{formatRelativeTime(cand.pothole.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suspected Duplicate Pothole */}
                                    <div className="flex gap-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
                                        <div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-muted">
                                            {cand.duplicate.imageUrl ? (
                                                <Image
                                                    src={cand.duplicate.imageUrl}
                                                    alt={cand.duplicate.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="size-full flex items-center justify-center text-muted-foreground">
                                                    <AlertTriangle className="size-4 opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                                    Candidate Duplicate
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    #{cand.duplicate.id.slice(-6)}
                                                </span>
                                            </div>
                                            <h5 className="text-xs font-semibold text-foreground truncate">
                                                {cand.duplicate.title}
                                            </h5>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span className="font-medium text-amber-500 flex items-center gap-0.5">
                                                    <ThumbsUp className="size-2.5" />
                                                    {cand.duplicate.votesCount || 0}
                                                </span>
                                                <span>•</span>
                                                <span>L{cand.duplicate.severity} Severity</span>
                                                <span>•</span>
                                                <span>{formatRelativeTime(cand.duplicate.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Action Footer */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="text-[11px] text-muted-foreground hidden sm:block">
                                        Merging will combine citizen upvotes into primary report #{cand.pothole.id.slice(-6)}
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        {/* Quick Dismiss */}
                                        {onQuickResolve && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onQuickResolve(cand.id, 'REJECTED')}
                                                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-600 gap-1"
                                                title="Dismiss as separate unique report"
                                            >
                                                <XCircle className="size-3.5" />
                                                <span className="hidden md:inline">Dismiss</span>
                                            </Button>
                                        )}

                                        {/* Primary Review Modal Trigger */}
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => onReviewCandidate(cand)}
                                            className="h-8 px-3 text-xs font-medium gap-1.5 shadow-2xs"
                                        >
                                            <GitMerge className="size-3.5" />
                                            <span>Review & Compare</span>
                                            <ArrowRight className="size-3 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
