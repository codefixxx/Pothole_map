'use client';

import dynamic from 'next/dynamic';
import React, { forwardRef } from 'react';
import type { MapContainerRef } from './map-container';

const DynamicMapContainer = dynamic(
    () => import('./map-container').then((mod) => mod.MapContainer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-xl border bg-muted/30">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Initializing Vector Map Engine...</span>
                </div>
            </div>
        ),
    }
);

export const MapView = forwardRef<MapContainerRef, React.ComponentProps<typeof DynamicMapContainer>>(
    function MapView(props, ref) {
        return <DynamicMapContainer {...props} ref={ref as any} />;
    }
);

export type { MapContainerRef };
