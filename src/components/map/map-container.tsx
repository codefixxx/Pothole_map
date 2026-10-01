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
    modeSwitcherPosition?: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';
    interactive?: boolean;
    jurisdictionPolygon?: any;
    enableClustering?: boolean;
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
        case 'ONGOING':
        case 'ASSIGNED':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
        case 'RESOLVED':
        case 'FIXED':
        case 'REPAIR_COMPLETED':
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
}

function declusterMarkers<T extends { latitude: number; longitude: number; id: string }>(rawMarkers: T[]): (T & { clusterCount?: number })[] {
    const groups: Record<string, T[]> = {};

    rawMarkers.forEach((m) => {
        if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return;
        const key = `${m.latitude.toFixed(4)},${m.longitude.toFixed(4)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });

    const declustered: (T & { clusterCount?: number })[] = [];

    Object.values(groups).forEach((group) => {
        if (group.length === 1) {
            declustered.push(group[0]);
        } else {
            const count = group.length;
            group.forEach((item, index) => {
                const itemsInRing = 8;
                const ringIndex = Math.floor(index / itemsInRing);
                const posInRing = index % itemsInRing;
                const totalInThisRing = Math.min(count - ringIndex * itemsInRing, itemsInRing);

                const angle = (2 * Math.PI * posInRing) / totalInThisRing + (ringIndex * 0.4);
                const radiusDegrees = 0.00018 * (ringIndex + 1);

                const latOffset = radiusDegrees * Math.sin(angle);
                const lngOffset = (radiusDegrees * Math.cos(angle)) / Math.cos((item.latitude * Math.PI) / 180);

                declustered.push({
                    ...item,
                    latitude: item.latitude + latOffset,
                    longitude: item.longitude + lngOffset,
                    clusterCount: count,
                });
            });
        }
    });

    return declustered;
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
        modeSwitcherPosition = 'bottom-left',
        interactive = true,
        jurisdictionPolygon,
        enableClustering = true,
    },
    ref
) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const draggableMarkerRef = useRef<Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { resolvedTheme } = useTheme();

    const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');

    // Determine appropriate style based on theme and mode
    const activeStyle = mapMode === 'satellite'
        ? MAP_STYLES.satellite
        : resolvedTheme === 'dark'
        ? MAP_STYLES.dark
        : MAP_STYLES.light;

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

    // Update style when theme or mapMode changes
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        try {
            mapRef.current.setStyle(activeStyle);
        } catch (err) {
            console.warn('[MapContainer] Could not update style on theme/mode change:', err);
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

    // Render Jurisdiction Boundary Polygon
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !jurisdictionPolygon) return;
        const map = mapRef.current;
        try {
            const geom = jurisdictionPolygon.type
                ? jurisdictionPolygon
                : {
                      type: 'Polygon',
                      coordinates: jurisdictionPolygon.coordinates || jurisdictionPolygon,
                  };

            const geojsonData = {
                type: 'Feature',
                properties: {},
                geometry: geom,
            };

            const source = map.getSource('jurisdiction-boundary') as any;
            if (source) {
                source.setData(geojsonData);
            } else {
                map.addSource('jurisdiction-boundary', {
                    type: 'geojson',
                    data: geojsonData as any,
                });
                map.addLayer({
                    id: 'jurisdiction-fill',
                    type: 'fill',
                    source: 'jurisdiction-boundary',
                    paint: {
                        'fill-color': '#3b82f6',
                        'fill-opacity': 0.1,
                    },
                });
                map.addLayer({
                    id: 'jurisdiction-line',
                    type: 'line',
                    source: 'jurisdiction-boundary',
                    paint: {
                        'line-color': '#2563eb',
                        'line-width': 2.5,
                        'line-dasharray': [3, 2],
                    },
                });
            }
        } catch (err) {
            console.warn('[MapContainer] Error rendering jurisdiction polygon:', err);
        }
    }, [jurisdictionPolygon, mapLoaded]);

    // Render Markers with MapLibre GeoJSON Layer Clustering & declustering
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        const map = mapRef.current;

        // Clear existing DOM markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // GeoJSON Feature Collection for Vector Layer Clustering
        const geojsonFeatures = markers.map((m) => ({
            type: 'Feature' as const,
            properties: {
                id: m.id,
                title: m.title,
                description: m.description,
                status: m.status,
                severity: m.severity,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [m.longitude, m.latitude],
            },
        }));

        const geojsonData = {
            type: 'FeatureCollection' as const,
            features: geojsonFeatures,
        };

        if (enableClustering) {
            try {
                const clusterSource = map.getSource('pothole-hazard-clusters') as any;
                if (clusterSource) {
                    clusterSource.setData(geojsonData);
                } else {
                    map.addSource('pothole-hazard-clusters', {
                        type: 'geojson',
                        data: geojsonData,
                        cluster: true,
                        clusterMaxZoom: 14,
                        clusterRadius: 50,
                    });

                    // Cluster Circle Layer
                    map.addLayer({
                        id: 'pothole-cluster-circles',
                        type: 'circle',
                        source: 'pothole-hazard-clusters',
                        filter: ['has', 'point_count'],
                        paint: {
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#f59e0b', // Amber (< 10 points)
                                10,
                                '#ea580c', // Orange (10-50 points)
                                50,
                                '#dc2626', // Red (50+ points)
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                18,
                                10,
                                24,
                                50,
                                30,
                            ],
                            'circle-stroke-width': 3,
                            'circle-stroke-color': '#ffffff',
                        },
                    });

                    // Cluster Count Text Label Layer
                    map.addLayer({
                        id: 'pothole-cluster-counts',
                        type: 'symbol',
                        source: 'pothole-hazard-clusters',
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': '{point_count_abbreviated}',
                            'text-size': 12,
                        },
                        paint: {
                            'text-color': '#ffffff',
                        },
                    });

                    // Click cluster to zoom in
                    map.on('click', 'pothole-cluster-circles', (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['pothole-cluster-circles'],
                        });
                        const clusterId = features[0]?.properties?.cluster_id;
                        const source = map.getSource('pothole-hazard-clusters') as any;
                        if (source && clusterId !== undefined) {
                            source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                                if (err) return;
                                const geom = features[0].geometry as any;
                                map.easeTo({
                                    center: geom.coordinates,
                                    zoom: zoom,
                                });
                            });
                        }
                    });

                    map.on('mouseenter', 'pothole-cluster-circles', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });
                    map.on('mouseleave', 'pothole-cluster-circles', () => {
                        map.getCanvas().style.cursor = '';
                    });
                }
            } catch (err) {
                console.warn('[MapContainer] GeoJSON cluster layer error:', err);
            }
        }

        const displayMarkers = declusterMarkers(markers);

        displayMarkers.forEach((item) => {
            const isSelected = selectedMarkerId === item.id;
            const status = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
            const isHighSeverity = item.severity === 'HIGH';

            const el = document.createElement('div');
            el.className = `group relative cursor-pointer z-${isSelected ? '30' : '10'}`;

            const iconSvg = getStatusSvgIcon(item.status);
            const clusterBadgeHtml = item.clusterCount && item.clusterCount > 1
                ? `<span class="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900/90 dark:bg-zinc-100 dark:text-zinc-900 px-1 text-[10px] font-extrabold text-white dark:text-zinc-950 ring-1.5 ring-white dark:ring-zinc-950 shadow-md pointer-events-none">${item.clusterCount}</span>`
                : '';

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
                        ${clusterBadgeHtml}
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
    }, [markers, mapLoaded, onMarkerClick, selectedMarkerId, enableClustering]);

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
        <div className={cn('relative overflow-hidden rounded-xl border w-full h-full min-h-[400px] [&_.maplibregl-ctrl-top-right]:mt-16 [&_.maplibregl-ctrl-top-right]:sm:mt-2', className)}>
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/40 backdrop-blur-xs z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span className="text-xs font-medium text-muted-foreground">Loading Vector Map Engine...</span>
                    </div>
                </div>
            )}
            
            {/* Map Layer Mode Switcher Pill */}
            {showControls && mapLoaded && (
                <div
                    className={cn(
                        'absolute z-20 flex items-center rounded-lg bg-background/90 p-1 shadow-md backdrop-blur-md border border-border',
                        modeSwitcherPosition === 'top-left' && 'top-3 left-3',
                        modeSwitcherPosition === 'bottom-left' && 'bottom-4 left-3 sm:bottom-6 sm:left-6',
                        modeSwitcherPosition === 'top-right' && 'top-3 right-12 sm:right-14',
                        modeSwitcherPosition === 'bottom-right' && 'bottom-4 right-3 sm:bottom-6 sm:right-4'
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setMapMode('street')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            mapMode === 'street'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                        Street
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapMode('satellite')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            mapMode === 'satellite'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                        Satellite
                    </button>
                </div>
            )}

            <div
                ref={mapContainerRef}
                className={cn(
                    'h-full w-full',
                    resolvedTheme === 'dark' && mapMode !== 'satellite' && '[&_.maplibregl-canvas]:invert-[90%] [&_.maplibregl-canvas]:hue-rotate-180 [&_.maplibregl-canvas]:brightness-90 [&_.maplibregl-canvas]:contrast-115'
                )}
            />
        </div>
    );
});
