import { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/src/components/layout';
import './globals.css';
import { Toaster } from '@/src/components/ui/sonner';
import { TooltipProvider } from '@/src/components/ui/tooltip';

export const metadata: Metadata = {
    title: {
        default: 'PotholeMap — Instant Civic Road Hazard Reporting & Municipal Triage',
        template: '%s | PotholeMap',
    },
    description:
        'Report road hazards in seconds with instant GPS acquisition, parallel image upload, automated PostGIS municipal jurisdiction boundary routing, and live lifecycle status updates.',
    keywords: [
        'pothole map',
        'civic reporting',
        'road hazard report',
        'municipality triage',
        'postgis routing',
        'smart city',
        'pothole tracking',
        'urban maintenance',
    ],
    authors: [{ name: 'PotholeMap Production Team' }],
    creator: 'PotholeMap Platform',
    metadataBase: new URL('http://localhost:3000'),
    openGraph: {
        title: 'PotholeMap — Instant Civic Road Hazard Reporting',
        description:
            'Report road hazards in seconds with instant GPS acquisition, parallel photo upload, automated PostGIS municipal routing, and real-time status updates.',
        url: 'http://localhost:3000',
        siteName: 'PotholeMap Production Platform',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
                width: 1200,
                height: 630,
                alt: 'PotholeMap Interactive Map Preview',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PotholeMap — Instant Civic Road Hazard Reporting',
        description:
            'Report road hazards in seconds with instant GPS acquisition, parallel photo upload, automated PostGIS municipal routing, and real-time status updates.',
        creator: '@potholemap',
        images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className="scroll-smooth no-scrollbar"
        >
            <head />
            <body className="min-h-screen bg-background font-sans antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider delayDuration={200}>
                        {children}
                    </TooltipProvider>
                    <Toaster position="bottom-right" richColors />
                </ThemeProvider>
            </body>
        </html>
    );
}
