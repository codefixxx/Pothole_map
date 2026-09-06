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
    ArrowUpDown,
    CheckCircle2,
    Clock,
    Wrench,
    XCircle,
    ShieldCheck,
    ThumbsUp,
    MessageSquare,
    UserCheck,
    ExternalLink,
    AlertTriangle,
    RotateCcw,
    GitMerge,
} from 'lucide-react';

interface TriageTableProps {
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

function getSeverityBadge(severity: number) {
    if (severity >= 4) {
        return (
            <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] px-1.5 py-0.5">
                Critical (L{severity})
            </Badge>
        );
    }
    if (severity === 3) {
        return (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0.5">
                Medium (L3)
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 text-[10px] px-1.5 py-0.5">
            Low (L{severity})
        </Badge>
    );
}

function getPriorityPill(score: number) {
    let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    if (score >= 80) {
        color = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25';
    } else if (score >= 60) {
        color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25';
    }
    return (
        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border ${color}`}>
            <span>P{score}</span>
        </span>
    );
}

export function TriageTable({
    potholes,
    selectedPotholeId,
    onSelectPothole,
    onOpenTransitionModal,
    onOpenAssignModal,
    isManagerOrAdmin = true,
    duplicateCandidates = [],
    onOpenDuplicateReview,
}: TriageTableProps) {
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
        <div className="w-full overflow-x-auto rounded-xl border border-border/70 bg-card shadow-xs">
            <table className="w-full text-left text-xs">
                <thead className="border-b border-border/70 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                        <th className="py-3 px-4">Defect Case</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Severity</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Civic Votes</th>
                        <th className="py-3 px-3">Assigned Officer</th>
                        <th className="py-3 px-3">Age</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
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
                            <tr
                                key={pothole.id}
                                onClick={() => onSelectPothole(pothole)}
                                className={`group cursor-pointer transition-colors ${
                                    isSelected
                                        ? 'bg-primary/5 dark:bg-primary/10'
                                        : 'hover:bg-muted/40'
                                }`}
                            >
                                {/* Photo Thumbnail & Title */}
                                <td className="py-3 px-4 max-w-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted">
                                            {pothole.imageUrl ? (
                                                <Image
                                                    src={pothole.imageUrl}
                                                    alt={pothole.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                    <AlertTriangle className="size-4 opacity-40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-mono text-[10px] text-muted-foreground font-semibold">
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
                                                        <span>Duplicate Match ({Math.round(matchingCandidate.confidenceScore * 100)}%)</span>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="font-semibold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">
                                                {pothole.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                {pothole.city || 'Central NDMC'}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <Badge
                                        variant="outline"
                                        className={`gap-1.5 text-[10px] font-semibold py-0.5 px-2 ${statusConfig.badgeClass}`}
                                    >
                                        <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`} />
                                        <StatusIcon className="size-3" />
                                        <span>{statusConfig.label}</span>
                                    </Badge>
                                </td>

                                {/* Severity */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    {getSeverityBadge(pothole.severity)}
                                </td>

                                {/* Priority Score */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    {getPriorityPill(pothole.priorityScore)}
                                </td>

                                {/* Civic Votes & Comments */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                        <span className="flex items-center gap-1 text-[11px] font-medium">
                                            <ThumbsUp className="size-3 text-amber-500" />
                                            {upvoteCount}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px]">
                                            <MessageSquare className="size-3" />
                                            {commentCount}
                                        </span>
                                    </div>
                                </td>

                                {/* Assigned Officer */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    {pothole.assignedOfficer ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                {pothole.assignedOfficer.name[0]}
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {pothole.assignedOfficer.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground italic">
                                            Unassigned
                                        </span>
                                    )}
                                </td>

                                {/* Age */}
                                <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-[11px] font-mono">
                                    {formatRelativeTime(pothole.createdAt)}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                        {/* Status Transition Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onOpenTransitionModal(pothole)}
                                            className="h-7 px-2 text-[11px] gap-1 font-medium"
                                            title="Update status according to policy"
                                        >
                                            <RotateCcw className="size-3 text-muted-foreground" />
                                            <span>Transition</span>
                                        </Button>

                                        {/* Assign Officer Button */}
                                        {isManagerOrAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onOpenAssignModal(pothole)}
                                                className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                                                title="Assign field officer"
                                            >
                                                <UserCheck className="size-3" />
                                                <span className="hidden sm:inline">Assign</span>
                                            </Button>
                                        )}

                                        {/* Inspect Button */}
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground hover:text-foreground"
                                            title="View full report detail"
                                        >
                                            <Link href={`/potholes/${pothole.id}`} target="_blank">
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
