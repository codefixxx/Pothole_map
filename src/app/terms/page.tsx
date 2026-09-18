import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Logo, ThemeToggle, Footer } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { FileText, CheckCircle2, AlertOctagon, Scale, ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service | PotholeMap',
    description: 'Terms of Service, civic reporting guidelines, user conduct rules, and municipal disclaimers for PotholeMap.',
};

export default function TermsOfServicePage() {
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
                            <Badge variant="outline" className="text-xs font-mono text-purple-600 dark:text-purple-400 border-purple-500/20">
                                Platform Agreement
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center gap-3">
                            <FileText className="size-8 text-purple-500" />
                            <span>Terms of Service</span>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Effective Date: September 19, 2026 • Platform Version 2.0
                        </p>
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-muted-foreground">
                                By accessing or using PotholeMap, you agree to comply with these Terms of Service. PotholeMap provides civic reporting technology connecting citizens with municipal road maintenance authorities.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <AlertOctagon className="size-4 text-amber-500" />
                                2. Civic Reporting Conduct & Accuracy
                            </h2>
                            <p className="text-muted-foreground">
                                Users agree to submit truthful, accurate reports depicting genuine road hazards. Submitting fraudulent reports, stock photographs, offensive content, or intentionally misleading coordinates is strictly prohibited and will result in account suspension and IP rate limiting.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <Scale className="size-4 text-blue-500" />
                                3. Municipal Jurisdiction Disclaimer
                            </h2>
                            <p className="text-muted-foreground">
                                PotholeMap routes reports to municipal entities based on PostGIS boundary data. Resolution timelines, work schedules, and physical repairs remain under the sole jurisdiction and operational authority of the respective municipality.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="text-base font-semibold flex items-center gap-2 text-card-foreground">
                                <ShieldAlert className="size-4 text-red-500" />
                                4. Safety & Hazard Warnings
                            </h2>
                            <p className="text-muted-foreground">
                                Citizens must never place themselves in physical danger or impede traffic to capture photographs or record GPS coordinates. Always capture report photos from a safe pedestrian vantage point.
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
