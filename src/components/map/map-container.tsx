'use client';

import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, GeolocateControl, Popup } from 'maplibre-gl';
import { useTheme } from 'next-themes';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLES, OSM_RASTER_STYLE, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MapMarkerItem, STATUS_COLORS } from '@/src/lib/map-config';
import { cn } from '@/src/lib/utils';

export interface MapContainerRef {
    flyTo: (coords: [number, number], zoom?: number) => void;
}

interface MapContainerProps {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    markers?: MapMarkerItem[];
    selectedMarkerId?: string | null;
    onMarkerClick?: (marker: MapMarkerItem) => void;
    draggableMarkerCoord?: [number, number] | null;
    onDraggableMarkerMove?: (coords: [number, number]) => void;
    className?: string;
    showControls?: boolean;
    interactive?: boolean;
}

function getStatusSvgIcon(status: string) {
    switch (status) {
        case 'PENDING':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        case 'UNDER_REVIEW':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
        case 'VERIFIED':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
        case 'IN_PROGRESS':
        case 'ASSIGNED':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
        case 'RESOLVED':
        case 'REPAIR_COMPLETED':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(function MapContainer(
    {
        center = DEFAULT_MAP_CENTER,
        zoom = DEFAULT_MAP_ZOOM,
        markers = [],
        selectedMarkerId,
        onMarkerClick,
        draggableMarkerCoord,
        onDraggableMarkerMove,
        className = 'w-full h-full min-h-[400px]',
        showControls = true,
        interactive = true,
    },
    ref
) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const draggableMarkerRef = useRef<Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { resolvedTheme } = useTheme();

    // Determine appropriate style based on theme
    const activeStyle = resolvedTheme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light;

    // Expose flyTo imperative handle
    useImperativeHandle(ref, () => ({
        flyTo(coords: [number, number], zoomLevel = 15) {
            if (!mapRef.current) return;
            mapRef.current.flyTo({
                center: coords,
                zoom: zoomLevel,
                essential: true,
                speed: 1.2,
                curve: 1.4,
            });
        },
    }));

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        let map: MapLibreMap | null = null;
        let timer: NodeJS.Timeout | null = null;

        try {
            map = new MapLibreMap({
                container: mapContainerRef.current,
                style: activeStyle,
                center: center,
                zoom: zoom,
                interactive: interactive,
                attributionControl: false,
            });

            if (showControls) {
                map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
                const geolocate = new GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                });
                map.addControl(geolocate, 'top-right');
            }

            const markLoaded = () => {
                setMapLoaded(true);
            };

            map.on('load', markLoaded);
            map.on('styledata', markLoaded);
            map.once('render', markLoaded);

            // Resilient fallback if vector tiles fail or are blocked
            map.on('error', (e) => {
                console.warn('[MapContainer] MapLibre warning/error:', e);
                if (e && (e as any).error && (e as any).error.message?.includes('style')) {
                    try {
                        map?.setStyle(OSM_RASTER_STYLE as any);
                    } catch {}
                }
            });

            // Ensure loading spinner dismisses once map renders or within 1.5s
            timer = setTimeout(() => {
                setMapLoaded(true);
            }, 1500);

            mapRef.current = map;
        } catch (err: any) {
            console.error('[MapContainer] MapLibre initialization failed, falling back to raster style:', err);
            try {
                map = new MapLibreMap({
                    container: mapContainerRef.current,
                    style: OSM_RASTER_STYLE as any,
                    center: center,
                    zoom: zoom,
                    interactive: interactive,
                    attributionControl: false,
                });
                mapRef.current = map;
                setMapLoaded(true);
            } catch (fallbackErr) {
                console.error('[MapContainer] Critical map failure:', fallbackErr);
                setMapLoaded(true);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
            map?.remove();
            mapRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update style when theme changes
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        try {
            mapRef.current.setStyle(activeStyle);
        } catch (err) {
            console.warn('[MapContainer] Could not update style on theme change:', err);
        }
    }, [activeStyle, mapLoaded]);

    // Update center if props change
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        try {
            mapRef.current.easeTo({
                center: center,
                zoom: zoom,
                duration: 800,
            });
        } catch {}
    }, [center, zoom, mapLoaded]);

    // Render Markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        markers.forEach((item) => {
            const isSelected = selectedMarkerId === item.id;
            const status = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
            const isHighSeverity = item.severity === 'HIGH';

            const el = document.createElement('div');
            el.className = `group relative cursor-pointer z-${isSelected ? '30' : '10'}`;

            const iconSvg = getStatusSvgIcon(item.status);

            el.innerHTML = `
                <div class="relative flex items-center justify-center">
                    ${
                        isHighSeverity || isSelected
                            ? `<span class="absolute inline-flex ${
                                  isSelected ? 'h-11 w-11' : 'h-8 w-8'
                              } animate-ping rounded-full opacity-40" style="background-color: ${
                                  isSelected ? '#ef4444' : status.hex
                              }"></span>`
                            : ''
                    }
                    <div class="relative flex ${
                        isSelected ? 'h-10 w-10 ring-4 ring-white dark:ring-zinc-900 shadow-2xl scale-110' : 'h-8 w-8 ring-2 ring-white dark:ring-zinc-950 shadow-md'
                    } items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-125" style="background-color: ${
                        status.hex
                    }">
                        ${iconSvg}
                    </div>
                </div>
            `;

            if (onMarkerClick) {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onMarkerClick(item);
                });
            }

            const marker = new Marker({ element: el })
                .setLngLat([item.longitude, item.latitude])
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [markers, mapLoaded, onMarkerClick, selectedMarkerId]);

    // Handle Draggable Marker (for report capture)
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        if (draggableMarkerRef.current) {
            draggableMarkerRef.current.remove();
            draggableMarkerRef.current = null;
        }

        if (draggableMarkerCoord) {
            const dragEl = document.createElement('div');
            dragEl.className = 'cursor-grab active:cursor-grabbing z-40';
            dragEl.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="rounded-full bg-red-600 p-2 text-white shadow-2xl ring-4 ring-red-300 dark:ring-red-950 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <span class="mt-1 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-xs">
                        Drag to adjust location
                    </span>
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
        <div className={cn('relative overflow-hidden rounded-xl border w-full h-full min-h-[400px]', className)}>
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/40 backdrop-blur-xs z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span className="text-xs font-medium text-muted-foreground">Loading Vector Tiles...</span>
                    </div>
                </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
        </div>
    );
});
