'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/src/components/ui/dialog';
import { PotholeDetailView, PotholeDetailData } from './pothole-detail-view';
import { Skeleton } from '@/src/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface PotholeDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    potholeId?: string | null;
    initialData?: PotholeDetailData | null;
}

export function PotholeDetailModal({
    open,
    onOpenChange,
    potholeId,
    initialData,
}: PotholeDetailModalProps) {
    const [pothole, setPothole] = useState<PotholeDetailData | null>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        if (initialData && (!potholeId || initialData.id === potholeId)) {
            setPothole(initialData);
            setLoading(false);
            return;
        }

        if (!potholeId) return;

        let isMounted = true;
        async function fetchDetail() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/potholes/${potholeId}`);
                if (!res.ok) {
                    throw new Error(`Failed to load pothole (${res.status})`);
                }
                const json = await res.json();
                if (isMounted) {
                    setPothole(json.data);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Unable to retrieve pothole details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchDetail();

        return () => {
            isMounted = false;
        };
    }, [open, potholeId, initialData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-border bg-background/98 backdrop-blur-2xl">
                <DialogTitle className="sr-only">
                    {pothole ? pothole.title : 'Hazard Inspection'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Inspect detailed information, photo proof, lifecycle transitions, and civic metadata.
                </DialogDescription>

                {loading ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-28 rounded-xl" />
                            <Skeleton className="h-28 rounded-xl" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <AlertCircle className="size-10 text-destructive" />
                        <h4 className="font-semibold text-base text-foreground">Could not load report</h4>
                        <p className="text-xs text-muted-foreground">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="mt-2 text-xs"
                        >
                            Close
                        </Button>
                    </div>
                ) : pothole ? (
                    <PotholeDetailView
                        pothole={pothole}
                        layout="modal"
                        onClose={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
