'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, GeolocateControl } from 'maplibre-gl';
import { useTheme } from 'next-themes';
import { MAP_STYLES, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MapMarkerItem, STATUS_COLORS } from '@/src/lib/map-config';
import { Skeleton } from '@/src/components/ui/skeleton';

interface MapContainerProps {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    markers?: MapMarkerItem[];
    onMarkerClick?: (marker: MapMarkerItem) => void;
    draggableMarkerCoord?: [number, number] | null;
    onDraggableMarkerMove?: (coords: [number, number]) => void;
    className?: string;
    showControls?: boolean;
    interactive?: boolean;
}

export function MapContainer({
    center = DEFAULT_MAP_CENTER,
    zoom = DEFAULT_MAP_ZOOM,
    markers = [],
    onMarkerClick,
    draggableMarkerCoord,
    onDraggableMarkerMove,
    className = 'w-full h-full min-h-[400px]',
    showControls = true,
    interactive = true,
}: MapContainerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const draggableMarkerRef = useRef<Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { resolvedTheme } = useTheme();

    // Determine appropriate style based on theme
    const activeStyle = resolvedTheme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light;

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new MapLibreMap({
            container: mapContainerRef.current,
            style: activeStyle,
            center: center,
            zoom: zoom,
            interactive: interactive,
            attributionControl: false,
        });

        if (showControls) {
            map.addControl(new NavigationControl({ showCompass: true }), 'top-right');
            const geolocate = new GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
            });
            map.addControl(geolocate, 'top-right');
        }

        map.on('load', () => {
            setMapLoaded(true);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update style when theme changes
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        mapRef.current.setStyle(activeStyle);
    }, [activeStyle, mapLoaded]);

    // Update center if props change
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        mapRef.current.easeTo({
            center: center,
            zoom: zoom,
            duration: 800,
        });
    }, [center, zoom, mapLoaded]);

    // Render Markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        markers.forEach((item) => {
            const el = document.createElement('div');
            el.className = 'group relative cursor-pointer';

            const status = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;

            el.innerHTML = `
                <div class="relative flex items-center justify-center">
                    <span class="absolute inline-flex h-7 w-7 animate-ping rounded-full opacity-30" style="background-color: ${status.hex}"></span>
                    <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg dark:border-zinc-900 transition-transform duration-200 group-hover:scale-125" style="background-color: ${status.hex}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </div>
                </div>
            `;

            if (onMarkerClick) {
                el.addEventListener('click', () => onMarkerClick(item));
            }

            const marker = new Marker({ element: el })
                .setLngLat([item.longitude, item.latitude])
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [markers, mapLoaded, onMarkerClick]);

    // Handle Draggable Marker (for report capture)
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        if (draggableMarkerRef.current) {
            draggableMarkerRef.current.remove();
            draggableMarkerRef.current = null;
        }

        if (draggableMarkerCoord) {
            const dragEl = document.createElement('div');
            dragEl.className = 'cursor-grab active:cursor-grabbing';
            dragEl.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="rounded-full bg-red-600 p-2 text-white shadow-xl ring-4 ring-red-300 dark:ring-red-950 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                </div>
            `;

            const marker = new Marker({
                element: dragEl,
                draggable: true,
            })
                .setLngLat(draggableMarkerCoord)
                .addTo(mapRef.current);

            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                if (onDraggableMarkerMove) {
                    onDraggableMarkerMove([lngLat.lng, lngLat.lat]);
                }
            });

            draggableMarkerRef.current = marker;
        }
    }, [draggableMarkerCoord, mapLoaded, onDraggableMarkerMove]);

    return (
        <div className={`relative overflow-hidden rounded-xl border ${className}`}>
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/40 backdrop-blur-xs z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span className="text-xs font-medium text-muted-foreground">Loading Vector Map...</span>
                    </div>
                </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
        </div>
    );
}
