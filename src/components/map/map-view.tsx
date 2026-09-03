'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

export const MapView = dynamic(
    () => import('./map-container').then((mod) => mod.MapContainer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-xl border bg-muted/30">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Initializing Map Engine...</span>
                </div>
            </div>
        ),
    }
);
