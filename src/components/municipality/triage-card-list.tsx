'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    TriagePotholeItem,
    MunicipalStatus,
    DuplicateCandidateItem,
} from './types';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { formatRelativeTime } from '@/src/lib/utils';
import {
    Clock,
    ShieldCheck,
    Wrench,
    CheckCircle2,
    XCircle,
    ThumbsUp,
    MessageSquare,
    UserCheck,
    ExternalLink,
    AlertTriangle,
    RotateCcw,
    MapPin,
    GitMerge,
} from 'lucide-react';

interface TriageCardListProps {
    potholes: TriagePotholeItem[];
    selectedPotholeId?: string | null;
    onSelectPothole: (pothole: TriagePotholeItem) => void;
    onOpenTransitionModal: (pothole: TriagePotholeItem) => void;
    onOpenAssignModal: (pothole: TriagePotholeItem) => void;
    isManagerOrAdmin?: boolean;
    duplicateCandidates?: DuplicateCandidateItem[];
    onOpenDuplicateReview?: (candidate: DuplicateCandidateItem) => void;
}

const STATUS_CONFIG: Record<
    MunicipalStatus,
    { label: string; icon: React.ElementType; badgeClass: string; dotColor: string }
> = {
    PENDING: {
        label: 'Pending',
        icon: Clock,
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-500',
    },
    VERIFIED: {
        label: 'Verified',
        icon: ShieldCheck,
        badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
        dotColor: 'bg-indigo-500',
    },
    ONGOING: {
        label: 'Ongoing',
        icon: Wrench,
        badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
        dotColor: 'bg-sky-500',
    },
    FIXED: {
        label: 'Fixed',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
    },
    REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
        dotColor: 'bg-rose-500',
    },
};

export function TriageCardList({
    potholes,
    selectedPotholeId,
    onSelectPothole,
    onOpenTransitionModal,
    onOpenAssignModal,
    isManagerOrAdmin = true,
    duplicateCandidates = [],
    onOpenDuplicateReview,
}: TriageCardListProps) {
    if (potholes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
                <AlertTriangle className="size-8 text-muted-foreground opacity-40 mb-2" />
                <h3 className="text-sm font-semibold text-foreground">No reports match triage filters</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting the status or priority filter parameters above.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {potholes.map((pothole) => {
                const isSelected = selectedPotholeId === pothole.id;
                const statusConfig = STATUS_CONFIG[pothole.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;
                const upvoteCount = pothole.votes?.length ?? pothole.votesCount ?? 0;
                const commentCount = pothole.comments?.length ?? pothole.commentsCount ?? 0;
                const matchingCandidate = duplicateCandidates.find(
                    (c) => c.status === 'POTENTIAL' && (c.potholeId === pothole.id || c.duplicateId === pothole.id)
                );

                return (
                    <div
                        key={pothole.id}
                        onClick={() => onSelectPothole(pothole)}
                        className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-200 cursor-pointer text-left bg-card ${
                            isSelected
                                ? 'border-primary ring-2 ring-primary/30 shadow-md'
                                : 'border-border/70 hover:border-border hover:shadow-xs'
                        }`}
                    >
                        {/* Card Header: Photo Thumbnail, Report ID, Status & Priority */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted">
                                {pothole.imageUrl ? (
                                    <Image
                                        src={pothole.imageUrl}
                                        alt={pothole.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="64px"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <AlertTriangle className="size-5 opacity-40" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                            #{pothole.id.slice(-6).toUpperCase()}
                                        </span>
                                        {matchingCandidate && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenDuplicateReview?.(matchingCandidate);
                                                }}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                                title="Potential duplicate detected. Click to compare & resolve."
                                            >
                                                <GitMerge className="size-2.5" />
                                                <span>Dup ({Math.round(matchingCandidate.confidenceScore * 100)}%)</span>
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        {formatRelativeTime(pothole.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className={`gap-1 text-[10px] font-semibold py-0.5 px-2 ${statusConfig.badgeClass}`}
                                    >
                                        <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`} />
                                        <StatusIcon className="size-3" />
                                        <span>{statusConfig.label}</span>
                                    </Badge>

                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border bg-muted text-foreground">
                                        Score: {pothole.priorityScore}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 space-y-1 mb-3">
                            <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {pothole.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {pothole.description}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                                <MapPin className="size-3 shrink-0 text-primary/70" />
                                <span className="line-clamp-1">{pothole.city || 'Central NDMC'}</span>
                            </div>
                        </div>

                        {/* Officer & Civic Signals Row */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mb-3 text-xs text-muted-foreground">
                            <div>
                                {pothole.assignedOfficer ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-muted-foreground">Officer:</span>
                                        <span className="text-xs font-medium text-foreground">
                                            {pothole.assignedOfficer.name}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                        Awaiting assignment
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[11px]">
                                    <ThumbsUp className="size-3 text-amber-500" />
                                    {upvoteCount}
                                </span>
                                <span className="flex items-center gap-1 text-[11px]">
                                    <MessageSquare className="size-3" />
                                    {commentCount}
                                </span>
                            </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div
                            className="flex items-center justify-between gap-1.5 pt-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenTransitionModal(pothole)}
                                className="flex-1 h-8 text-xs gap-1.5 font-medium"
                            >
                                <RotateCcw className="size-3 text-muted-foreground" />
                                <span>Transition</span>
                            </Button>

                            {isManagerOrAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenAssignModal(pothole)}
                                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                    title="Assign Officer"
                                >
                                    <UserCheck className="size-3.5" />
                                    <span className="sr-only">Assign</span>
                                </Button>
                            )}

                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                title="Inspect Report"
                            >
                                <Link href={`/potholes/${pothole.id}`} target="_blank">
                                    <ExternalLink className="size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
