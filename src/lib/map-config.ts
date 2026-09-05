export const MAP_STYLES = {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/dark',
    cartoLight: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    cartoDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    fallbackLight: 'https://tiles.openfreemap.org/styles/liberty',
    fallbackDark: 'https://tiles.openfreemap.org/styles/dark',
};

export const OSM_RASTER_STYLE = {
    version: 8,
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
        },
    },
    layers: [
        {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
        },
    ],
};

export const DEFAULT_MAP_CENTER: [number, number] = [77.209, 28.6139]; // Default: New Delhi [lng, lat]
export const DEFAULT_MAP_ZOOM = 12;

export interface MapMarkerItem {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'REPAIR_COMPLETED' | 'RESOLVED' | 'REJECTED';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
    upvotesCount?: number;
    imageUrl?: string;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
    PENDING: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
        hex: '#f59e0b',
    },
    UNDER_REVIEW: {
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-500/30',
        hex: '#0ea5e9',
    },
    VERIFIED: {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500/30',
        hex: '#a855f7',
    },
    ASSIGNED: {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-500/30',
        hex: '#6366f1',
    },
    IN_PROGRESS: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/30',
        hex: '#3b82f6',
    },
    REPAIR_COMPLETED: {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-500/30',
        hex: '#14b8a6',
    },
    RESOLVED: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        hex: '#10b981',
    },
    REJECTED: {
        bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
        text: 'text-zinc-700 dark:text-zinc-400',
        border: 'border-zinc-500/30',
        hex: '#71717a',
    },
};
