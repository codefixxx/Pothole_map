'use client';

import React from 'react';
import { Status } from '@prisma/client';
import { Badge } from '@/src/components/ui/badge';
import {
    Clock,
    ShieldCheck,
    Wrench,
    CheckCircle2,
    XCircle,
    FileText,
    UserCheck,
    Calendar,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface StatusHistoryItem {
    id: string;
    oldStatus: Status | string;
    newStatus: Status | string;
    reason?: string | null;
    createdAt: string | Date;
    actor?: {
        id: string;
        name: string;
        role?: string;
    } | null;
}

interface LifecycleStepperProps {
    currentStatus: Status | string;
    statusHistories?: StatusHistoryItem[];
    createdAt?: string | Date;
    verifiedAt?: string | Date | null;
    fixedAt?: string | Date | null;
    className?: string;
}

interface StepDefinition {
    key: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    activeRing: string;
}

const LIFECYCLE_STEPS: StepDefinition[] = [
    {
        key: 'PENDING',
        label: 'Reported',
        description: 'Citizen filed hazard with GPS lock',
        icon: Clock,
        color: 'bg-amber-500 text-white',
        activeRing: 'ring-amber-500/30',
    },
    {
        key: 'VERIFIED',
        label: 'Verified',
        description: 'Municipal officer audited & confirmed',
        icon: ShieldCheck,
        color: 'bg-purple-500 text-white',
        activeRing: 'ring-purple-500/30',
    },
    {
        key: 'ONGOING',
        label: 'Work in Progress',
        description: 'Crew dispatched with asphalt team',
        icon: Wrench,
        color: 'bg-blue-500 text-white',
        activeRing: 'ring-blue-500/30',
    },
    {
        key: 'FIXED',
        label: 'Repaired',
        description: 'Resurfacing complete & cleared',
        icon: CheckCircle2,
        color: 'bg-emerald-500 text-white',
        activeRing: 'ring-emerald-500/30',
    },
];

function getStepIndex(status: string): number {
    switch (status) {
        case 'PENDING':
            return 0;
        case 'UNDER_REVIEW':
            return 0;
        case 'VERIFIED':
            return 1;
        case 'ASSIGNED':
        case 'ONGOING':
        case 'IN_PROGRESS':
            return 2;
        case 'REPAIR_COMPLETED':
        case 'FIXED':
        case 'RESOLVED':
            return 3;
        case 'REJECTED':
            return -1;
        default:
            return 0;
    }
}

export function LifecycleStepper({
    currentStatus,
    statusHistories = [],
    createdAt,
    verifiedAt,
    fixedAt,
    className,
}: LifecycleStepperProps) {
    const isRejected = currentStatus === 'REJECTED';
    const activeIndex = getStepIndex(currentStatus);

    // Find latest rejection reason if available
    const latestRejection = statusHistories.find((h) => h.newStatus === 'REJECTED');

    // Helper to format date
    const formatDate = (dateVal: string | Date | undefined | null) => {
        if (!dateVal) return null;
        const d = new Date(dateVal);
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* If Rejected, display specialized banner */}
            {isRejected ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-full bg-destructive p-2 text-destructive-foreground">
                            <XCircle className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-destructive">
                                    Report Rejected by Municipality
                                </h4>
                                <Badge variant="destructive" className="text-[10px]">
                                    REJECTED
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This report was audited by the municipal patrol team and flagged as not requiring
                                intervention or as a false positive.
                            </p>
                            {latestRejection?.reason && (
                                <div className="mt-2 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs text-foreground">
                                    <span className="font-semibold text-muted-foreground">Officer Note: </span>
                                    {latestRejection.reason}
                                </div>
                            )}
                            {latestRejection?.actor && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Decision logged by {latestRejection.actor.name} on{' '}
                                    {formatDate(latestRejection.createdAt)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Standard Linear Progress Stepper */
                <div className="relative">
                    {/* Stepper Steps Desktop/Tablet */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
                        {LIFECYCLE_STEPS.map((step, idx) => {
                            const isCompleted = idx < activeIndex;
                            const isCurrent = idx === activeIndex;
                            const isUpcoming = idx > activeIndex;

                            const Icon = step.icon;

                            // Look up if we have a matching history item for this step
                            let stepTimestamp: string | null = null;
                            if (idx === 0) stepTimestamp = formatDate(createdAt);
                            else if (idx === 1) {
                                stepTimestamp =
                                    formatDate(verifiedAt) ||
                                    formatDate(
                                        statusHistories.find((h) => h.newStatus === 'VERIFIED')?.createdAt
                                    );
                            } else if (idx === 2) {
                                stepTimestamp = formatDate(
                                    statusHistories.find(
                                        (h) => h.newStatus === 'ONGOING' || h.newStatus === 'IN_PROGRESS'
                                    )?.createdAt
                                );
                            } else if (idx === 3) {
                                stepTimestamp =
                                    formatDate(fixedAt) ||
                                    formatDate(
                                        statusHistories.find(
                                            (h) => h.newStatus === 'FIXED' || h.newStatus === 'RESOLVED'
                                        )?.createdAt
                                    );
                            }

                            return (
                                <div key={step.key} className="flex flex-col items-center text-center relative group">
                                    {/* Connecting Bar */}
                                    {idx > 0 && (
                                        <div
                                            className={cn(
                                                'absolute top-4 -left-1/2 w-full h-0.5 -z-1 transition-colors duration-300',
                                                idx <= activeIndex ? 'bg-primary' : 'bg-border'
                                            )}
                                        />
                                    )}

                                    {/* Step Circle Node */}
                                    <div
                                        className={cn(
                                            'size-8 sm:size-9 rounded-full flex items-center justify-center transition-all duration-300 z-10',
                                            isCompleted && 'bg-primary text-primary-foreground shadow-sm',
                                            isCurrent &&
                                                cn(
                                                    step.color,
                                                    'ring-4 shadow-md scale-110 animate-pulse-subtle',
                                                    step.activeRing
                                                ),
                                            isUpcoming && 'bg-muted border border-border text-muted-foreground'
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </div>

                                    {/* Labels */}
                                    <div className="mt-2.5 space-y-0.5 max-w-[110px] sm:max-w-none">
                                        <div className="flex items-center justify-center gap-1">
                                            <span
                                                className={cn(
                                                    'text-xs font-semibold tracking-tight',
                                                    isCurrent && 'text-foreground',
                                                    isCompleted && 'text-foreground/90',
                                                    isUpcoming && 'text-muted-foreground'
                                                )}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                        <p className="hidden sm:block text-[11px] text-muted-foreground line-clamp-1">
                                            {step.description}
                                        </p>
                                        {stepTimestamp && (
                                            <span className="block text-[10px] text-muted-foreground font-mono">
                                                {stepTimestamp}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Transition Audit Log Accordion / Card */}
            {statusHistories.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/60">
                    <div className="mb-2 flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                            Lifecycle Transition Audit Trail ({statusHistories.length})
                        </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {statusHistories.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs transition-colors hover:bg-muted/40"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-medium py-0 h-4">
                                            {entry.oldStatus.toString().replace('_', ' ')} →{' '}
                                            {entry.newStatus.toString().replace('_', ' ')}
                                        </Badge>
                                        {entry.actor && (
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <UserCheck className="size-3" />
                                                {entry.actor.name}
                                                {entry.actor.role === 'ADMIN' && (
                                                    <span className="text-[9px] text-primary font-mono">(Admin)</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {entry.reason && (
                                        <p className="text-[11px] text-foreground/90 pl-1 border-l-2 border-primary/40">
                                            &ldquo;{entry.reason}&rdquo;
                                        </p>
                                    )}
                                </div>

                                <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(entry.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
