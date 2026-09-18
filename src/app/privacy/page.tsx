import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Logo, ThemeToggle, Footer } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Shield, Lock, MapPin, Camera, UserCheck, Eye, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | PotholeMap',
    description: 'Learn how PotholeMap collects, protects, and utilizes GPS location data, camera photos, and civic report metadata.',
};

export default function PrivacyPolicyPage() {
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
            <main className="flex-1 container mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                Legal Transparency
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center gap-3">
                            <Shield className="size-8 text-emerald-500" />
                            <span>Privacy Policy</span>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Effective Date: September 19, 2026 • Platform Version 2.0
                        </p>
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <Lock className="size-4 text-emerald-500" />
                                1. Overview & Commitment
                            </h2>
                            <p className="text-muted-foreground">
                                PotholeMap is committed to protecting your privacy while enabling fast civic reporting. This Privacy Policy explains what information we collect when you submit a pothole report, navigate our interactive vector map, or interact with municipal triage tools.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <MapPin className="size-4 text-amber-500" />
                                2. Geolocation & Spatial Data Processing
                            </h2>
                            <p className="text-muted-foreground">
                                When you create a report, we collect device GPS coordinates (latitude, longitude, and accuracy radius). This data is processed strictly to match your report with the responsible municipal jurisdiction boundary using PostgreSQL PostGIS spatial containment queries (`ST_Contains`). You may manually adjust pin placement if GPS accuracy is low.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <Camera className="size-4 text-blue-500" />
                                3. Photo Uploads & EXIF Metadata
                            </h2>
                            <p className="text-muted-foreground">
                                Photographs uploaded during report submission are stored securely via object storage. Metadata embedded in photos (such as capture timestamp and camera specifications) is extracted to verify report authenticity and perform automated duplicate candidate detection.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <UserCheck className="size-4 text-purple-500" />
                                4. Municipal Jurisdiction Sharing
                            </h2>
                            <p className="text-muted-foreground">
                                Public hazard location, severity ratings, photos, and status histories are shared with authorized municipality officers and managers responsible for the containing jurisdiction. Personal account credentials (passwords, auth tokens) are never shared with municipal staff.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <Eye className="size-4 text-indigo-500" />
                                5. Citizen Control & Data Rights
                            </h2>
                            <p className="text-muted-foreground">
                                You retain the right to delete your reports or request account data purge. Once a report is marked as `RESOLVED`, fixed markers remain visible on public maps for 7 days to provide civic transparency before being archived.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            {/* Universal Footer */}
            <Footer />
        </div>
    );
}
