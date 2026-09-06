'use client';

import React, { useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import {
    TriagePotholeItem,
    MunicipalOfficer,
} from './types';
import {
    UserCheck,
    Loader2,
    Briefcase,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface OfficerAssignmentModalProps {
    pothole: TriagePotholeItem | null;
    officers: MunicipalOfficer[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (potholeId: string, officerId: string, officerName: string) => void;
}

export function OfficerAssignmentModal({
    pothole,
    officers,
    open,
    onOpenChange,
    onSuccess,
}: OfficerAssignmentModalProps) {
    const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
        pothole?.assignedOfficerId || null
    );
    const [loading, setLoading] = useState(false);

    if (!pothole) return null;

    const handleAssign = async () => {
        if (!selectedOfficerId) return;
        const selectedOfficer = officers.find((o) => o.id === selectedOfficerId);
        const officerName = selectedOfficer?.name || 'Assigned Officer';

        setLoading(true);
        try {
            const res = await fetch(`/api/potholes/${pothole.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    officerId: selectedOfficerId,
                    officerName,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Failed to assign officer');
            }

            toast.success(`Assigned to ${officerName}`);
            onSuccess(pothole.id, selectedOfficerId, officerName);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign officer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-border/80 bg-background/95 backdrop-blur-xl">
                <DialogHeader className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <UserCheck className="size-4" />
                        </div>
                        <DialogTitle className="text-base font-bold">
                            Assign Officer or Field Team
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Report #{pothole.id.slice(-6).toUpperCase()}: &quot;{pothole.title}&quot;
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <p className="text-xs text-muted-foreground">
                        Select a municipal inspector or road maintenance engineer responsible for this defect triage.
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {officers.map((officer) => {
                            const isSelected = selectedOfficerId === officer.id;
                            const initials = officer.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase();

                            return (
                                <button
                                    key={officer.id}
                                    type="button"
                                    onClick={() => setSelectedOfficerId(officer.id)}
                                    className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                                            : 'border-border/60 bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-9 border border-border">
                                            <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-foreground">
                                                    {officer.name}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-4 px-1.5 font-normal"
                                                >
                                                    {officer.role}
                                                </Badge>
                                            </div>
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Briefcase className="size-3 text-muted-foreground/70" />
                                                {officer.activeCases ?? 0} active cases
                                            </span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="size-3" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
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
                        disabled={loading || !selectedOfficerId}
                        onClick={handleAssign}
                        className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {loading && <Loader2 className="size-3.5 animate-spin" />}
                        <span>Confirm Assignment</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
