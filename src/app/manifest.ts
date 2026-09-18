import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PotholeMap Production Platform',
        short_name: 'PotholeMap',
        description:
            'Report road hazards in seconds with instant GPS acquisition, parallel image upload, automated PostGIS municipal jurisdiction boundary routing, and live lifecycle updates.',
        start_url: '/map',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#d97706',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
