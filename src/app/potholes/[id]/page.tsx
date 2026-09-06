'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PotholeDetailView, PotholeDetailData } from '@/src/components/pothole-detail';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Logo, ThemeToggle, DropdownMenuAvatar } from '@/src/components/layout';
import { useSession } from '@/src/lib/auth-client';
import {
    ArrowLeft,
    MapPin,
    AlertTriangle,
    PlusCircle,
    Compass,
    ChevronRight,
    Home,
} from 'lucide-react';

export default function PotholeDetailPage({
    params: paramsProp,
}: {
    params?: Promise<{ id: string }> | { id: string };
}) {
    const nextParams = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    // Support both Next.js App Router params prop and useParams hook
    const [potholeId, setPotholeId] = useState<string>('');

    useEffect(() => {
        if (nextParams?.id) {
            setPotholeId(nextParams.id as string);
        } else if (paramsProp) {
            Promise.resolve(paramsProp).then((p) => {
                if (p?.id) setPotholeId(p.id);
            });
        }
    }, [nextParams, paramsProp]);

    const [pothole, setPothole] = useState<PotholeDetailData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!potholeId) return;

        let isMounted = true;
        async function fetchPothole() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/potholes/${potholeId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Pothole report not found.');
                    }
                    throw new Error(`Failed to load pothole report (${res.status})`);
                }
                const json = await res.json();
                if (isMounted) {
                    setPothole(json.data);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Unable to retrieve report details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchPothole();

        return () => {
            isMounted = false;
        };
    }, [potholeId]);

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
            {/* Top Navigation Header */}
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md sm:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Logo className="h-7" />
                    </Link>

                    {/* Breadcrumbs Navigation */}
                    <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ChevronRight className="size-3.5 text-muted-foreground/60" />
                        <Link href="/map" className="hover:text-foreground transition-colors">
                            Live Map
                        </Link>
                        <ChevronRight className="size-3.5 text-muted-foreground/60" />
                        <span className="font-mono text-foreground/90 font-medium">
                            {potholeId ? `Report #${potholeId.slice(-6).toUpperCase()}` : 'Report Detail'}
                        </span>
                    </nav>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
                        <Link href="/map">
                            <MapPin className="size-3.5 text-primary" />
                            <span className="hidden sm:inline">Explore Map</span>
                            <span className="sm:hidden">Map</span>
                        </Link>
                    </Button>

                    <Button asChild size="sm" className="gap-1.5 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium">
                        <Link href="/map?report=true">
                            <PlusCircle className="size-3.5" />
                            <span className="hidden sm:inline">Report Hazard</span>
                            <span className="sm:hidden">Report</span>
                        </Link>
                    </Button>

                    <ThemeToggle />

                    {session?.user ? (
                        <DropdownMenuAvatar imageUrl={session.user.image} name={session.user.name} />
                    ) : (
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                            <Link href={`/auth/login?redirect=/potholes/${potholeId}`}>Login</Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content Body */}
            <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
                {/* Back to map action */}
                <div className="mb-6">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2">
                        <Link href="/map">
                            <ArrowLeft className="size-3.5" />
                            <span>Return to Live Map</span>
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-28 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-9 w-3/4 rounded-md" />
                            <Skeleton className="h-5 w-full rounded-md" />
                        </div>

                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-72 w-full rounded-xl" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
                        <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-3">
                            <AlertTriangle className="size-8" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Hazard Report Not Found</h2>
                        <p className="mt-1 text-sm text-muted-foreground max-w-md">
                            The report with ID &quot;{potholeId}&quot; could not be located or may have been removed.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                            <Button asChild variant="default" size="sm" className="gap-1.5">
                                <Link href="/map">
                                    <MapPin className="size-4" />
                                    <span>Browse Live Map</span>
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/">
                                    <Home className="size-4" />
                                    <span>Back to Home</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : pothole ? (
                    <PotholeDetailView pothole={pothole} layout="page" />
                ) : null}
            </main>
        </div>
    );
}
