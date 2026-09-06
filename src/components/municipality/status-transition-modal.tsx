'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import {
    TriagePotholeItem,
    MunicipalStatus,
    CENTRALIZED_TRANSITION_POLICY,
} from './types';
import {
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Clock,
    Wrench,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusTransitionModalProps {
    pothole: TriagePotholeItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (potholeId: string, newStatus: MunicipalStatus, reason?: string) => void;
}

const STATUS_ICONS: Record<MunicipalStatus, React.ElementType> = {
    PENDING: Clock,
    VERIFIED: ShieldCheck,
    ONGOING: Wrench,
    FIXED: CheckCircle2,
    REJECTED: XCircle,
};

const STATUS_COLORS: Record<MunicipalStatus, { bg: string; text: string; border: string }> = {
    PENDING: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
    },
    VERIFIED: {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-500/30',
    },
    ONGOING: {
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-500/30',
    },
    FIXED: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
    },
    REJECTED: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30',
    },
};

export function StatusTransitionModal({
    pothole,
    open,
    onOpenChange,
    onSuccess,
}: StatusTransitionModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<MunicipalStatus | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const currentStatus = pothole?.status || 'PENDING';
    const transitionRule = CENTRALIZED_TRANSITION_POLICY[currentStatus];
    const allowedNextStatuses = transitionRule?.allowedNext || [];

    // Reset selection when modal opens
    useEffect(() => {
        if (open && allowedNextStatuses.length > 0) {
            setSelectedStatus(allowedNextStatuses[0]);
            setReason('');
        }
    }, [open, currentStatus]);

    if (!pothole) return null;

    const CurrentIcon = STATUS_ICONS[currentStatus];
    const currentStyle = STATUS_COLORS[currentStatus];

    const isReasonRequired =
        selectedStatus === 'REJECTED' ||
        (currentStatus === 'FIXED' && selectedStatus === 'PENDING') ||
        (currentStatus === 'REJECTED' && selectedStatus === 'PENDING');

    const handleTransition = async () => {
        if (!selectedStatus) return;

        if (isReasonRequired && !reason.trim()) {
            toast.error('A transition justification reason is required for this action.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/potholes/${pothole.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: selectedStatus,
                    reason: reason.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Failed to update status');
            }

            toast.success(`Status transitioned to ${selectedStatus}`);
            onSuccess(pothole.id, selectedStatus, reason.trim());
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || 'Error processing status transition');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg border-border/80 bg-background/95 backdrop-blur-xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RotateCcw className="size-4" />
                        </div>
                        <DialogTitle className="text-base font-bold">
                            Lifecycle State Machine Transition
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Report #{pothole.id.slice(-6).toUpperCase()}: &quot;{pothole.title}&quot;
                    </DialogDescription>
                </DialogHeader>

                {/* State Transition Flow Visualizer */}
                <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3.5">
                        {/* Current Status */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">Current State</span>
                            <Badge
                                variant="outline"
                                className={`gap-1.5 px-2.5 py-1 text-xs font-semibold ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`}
                            >
                                <CurrentIcon className="size-3.5" />
                                <span>{currentStatus}</span>
                            </Badge>
                        </div>

                        <ArrowRight className="size-4 text-muted-foreground animate-pulse" />

                        {/* Selected Target Status */}
                        <div className="flex flex-col gap-1 text-right">
                            <span className="text-[11px] font-medium text-muted-foreground">Target Next State</span>
                            {selectedStatus ? (
                                <Badge
                                    variant="outline"
                                    className={`gap-1.5 px-2.5 py-1 text-xs font-semibold ml-auto ${STATUS_COLORS[selectedStatus].bg} ${STATUS_COLORS[selectedStatus].text} ${STATUS_COLORS[selectedStatus].border}`}
                                >
                                    {React.createElement(STATUS_ICONS[selectedStatus], { className: 'size-3.5' })}
                                    <span>{selectedStatus}</span>
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">Select state</span>
                            )}
                        </div>
                    </div>

                    {/* Centralized Policy Information Alert */}
                    <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border border-border/50">
                        <p className="leading-relaxed">
                            <span className="font-semibold text-foreground">Transition Policy: </span>
                            {transitionRule?.description}
                        </p>
                    </div>

                    {/* Selectable Allowable Next States */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Allowable Next States</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {allowedNextStatuses.map((st) => {
                                const Icon = STATUS_ICONS[st];
                                const style = STATUS_COLORS[st];
                                const isSelected = selectedStatus === st;

                                return (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setSelectedStatus(st)}
                                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                            isSelected
                                                ? `${style.bg} ${style.border} ring-2 ring-primary/40 shadow-xs`
                                                : 'border-border/60 bg-card hover:bg-muted/40 opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <div>
                                            <div className={`text-xs font-bold ${isSelected ? style.text : 'text-foreground'}`}>
                                                {st}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {st === 'VERIFIED' && 'Confirm valid defect'}
                                                {st === 'ONGOING' && 'Dispatch road crew'}
                                                {st === 'FIXED' && 'Patching completed'}
                                                {st === 'REJECTED' && 'Dismiss as invalid'}
                                                {st === 'PENDING' && 'Reopen report'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transition Reason & Municipal Log Note */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="transition-reason" className="text-xs font-medium">
                                Officer Reason & Municipal Audit Note
                            </Label>
                            {isReasonRequired ? (
                                <span className="text-[10px] font-medium text-rose-500 flex items-center gap-1">
                                    <AlertCircle className="size-3" />
                                    Required for this transition
                                </span>
                            ) : (
                                <span className="text-[10px] text-muted-foreground">Optional log note</span>
                            )}
                        </div>
                        <Textarea
                            id="transition-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={
                                selectedStatus === 'REJECTED'
                                    ? 'Explain reason for dismissal (e.g., Private property, Duplicate, Weather defect normal wear)...'
                                    : selectedStatus === 'FIXED'
                                    ? 'Notes on patch method, asphalt mix type, contractor team, or completion certification...'
                                    : 'Add notes for the municipal dispatch log...'
                            }
                            className="min-h-[85px] text-xs resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={loading || !selectedStatus || (isReasonRequired && !reason.trim())}
                        onClick={handleTransition}
                        className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {loading && <Loader2 className="size-3.5 animate-spin" />}
                        <span>Confirm Transition</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
