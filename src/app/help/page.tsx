import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Logo, ThemeToggle, Footer, CtaSection } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { HelpCircle, MapPin, ThumbsUp, Activity, ShieldCheck, ArrowLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Help & Civic Guide | PotholeMap',
    description: 'Learn how PotholeMap works: instant GPS reporting, PostGIS municipal routing, citizen upvotes, and state machine lifecycle transitions.',
};

const FAQ_ITEMS = [
    {
        q: 'How does reporting a pothole work?',
        a: 'Click "Report Pothole" anywhere on the platform. Upload a photo and let your browser capture your device GPS coordinates. Your report is automatically analyzed and routed to the responsible municipality based on geographic polygon containment.',
    },
    {
        q: 'What happens if GPS accuracy is off?',
        a: 'You can interactively drag the marker on the mini-map preview to fine-tune the pin placement. The platform tags the location source as MANUAL_ADJUSTMENT so officers know you verified the position.',
    },
    {
        q: 'What do Upvotes do?',
        a: 'Upvotes act as hazard confirmations from fellow commuters. Potholes with higher upvote counts and high severity ratings move to the top of the municipality triage queue.',
    },
    {
        q: 'What are the report status lifecycle stages?',
        a: 'Reports transition through a strict state machine: PENDING → VERIFIED (or REJECTED) → ONGOING → FIXED. Citizens receive notifications as status changes occur.',
    },
    {
        q: 'How are duplicate potholes handled?',
        a: 'Our background worker checks distance and AI image similarity scores. If a duplicate is confirmed, officers merge the report into the primary hazard while retaining all upvotes.',
    },
];

export default function HelpPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Logo className="h-7" />
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
                        <Link href="/map">
                            <ArrowLeft className="size-3.5" />
                            <span>Back to Map</span>
                        </Link>
                    </Button>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
                {/* Hero section */}
                <div className="space-y-4 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <Badge variant="outline" className="text-xs font-mono text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Civic Knowledge Base
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center gap-3 justify-center sm:justify-start">
                        <HelpCircle className="size-8 text-blue-500" />
                        <span>Help & Civic Guide</span>
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                        Everything you need to know about reporting road hazards, municipal triage workflows, and tracking repair progress in your community.
                    </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-card p-5 space-y-2 shadow-xs">
                        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 w-fit">
                            <MapPin className="size-5" />
                        </div>
                        <h3 className="font-semibold text-sm">1. Instant GPS Reporting</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Parallel photo upload and instant GPS acquisition get your report submitted in seconds.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-2 shadow-xs">
                        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 w-fit">
                            <ShieldCheck className="size-5" />
                        </div>
                        <h3 className="font-semibold text-sm">2. Automated PostGIS Routing</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            PostGIS polygon containment ST_Contains queries automatically assign reports to the right authority.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-2 shadow-xs">
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 w-fit">
                            <Activity className="size-5" />
                        </div>
                        <h3 className="font-semibold text-sm">3. Live Realtime Status</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Server-Sent Events (SSE) stream live status updates to your map and notification center in real-time.
                        </p>
                    </div>
                </div>

                {/* FAQ Accordion Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="size-5 text-amber-500" />
                        <span>Frequently Asked Questions</span>
                    </h2>

                    <div className="space-y-3">
                        {FAQ_ITEMS.map((item, idx) => (
                            <div key={idx} className="rounded-xl border bg-card p-5 space-y-2 shadow-xs">
                                <h3 className="font-semibold text-sm text-card-foreground flex items-center gap-2">
                                    <ChevronRight className="size-4 text-primary shrink-0" />
                                    <span>{item.q}</span>
                                </h3>
                                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                                    {item.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call-to-Action Banner */}
                <CtaSection />
            </main>

            {/* Universal Footer */}
            <Footer />
        </div>
    );
}
