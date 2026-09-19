'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ScrollTextEffect, ScrollAppear } from '@/src/components/motion';
import {
    Camera,
    MapPin,
    GitMerge,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Building2,
    Users,
    Activity,
    Layers,
    Wrench,
    Clock,
} from 'lucide-react';
import Link from 'next/link';

export function InteractiveShowcase() {
    const [activeTab, setActiveTab] = useState<'citizen' | 'ai' | 'officer'>('citizen');

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/30 to-background border-y border-border/50">
            <div className="mx-auto max-w-5xl px-6 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-1.5 border-primary/30 text-primary bg-primary/10 rounded-full">
                        <Sparkles className="size-3.5 text-amber-500" />
                        End-To-End Infrastructure
                    </Badge>

                    <ScrollTextEffect
                        as="h2"
                        per="word"
                        className="text-balance text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]"
                    >
                        Built For Citizens, Officers & Leaders
                    </ScrollTextEffect>

                    <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Experience the complete civic hazard lifecycle—from instant camera GPS capture to AI duplicate merging and municipal dispatch.
                    </p>
                </div>

                {/* Workflow Selection Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-muted/60 backdrop-blur-md rounded-2xl border border-border max-w-2xl mx-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('citizen')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'citizen'
                                ? 'bg-primary text-primary-foreground shadow-md scale-102'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <Camera className="size-4" />
                        <span>1. Citizen Instant Report</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'ai'
                                ? 'bg-primary text-primary-foreground shadow-md scale-102'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <GitMerge className="size-4" />
                        <span>2. AI Duplicate Match</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('officer')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'officer'
                                ? 'bg-primary text-primary-foreground shadow-md scale-102'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <Building2 className="size-4" />
                        <span>3. Municipal Officer Triage</span>
                    </button>
                </div>

                {/* Workflow Feature Card Showcase */}
                <ScrollAppear>
                    {activeTab === 'citizen' && (
                        <Card className="relative overflow-hidden border-primary/20 bg-card/90 shadow-xl backdrop-blur-xl">
                            <CardHeader className="p-6 sm:p-8 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="bg-emerald-500 text-white">
                                        Citizen Flow
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">01 / Instant Capture</span>
                                </div>
                                <CardTitle className="text-2xl font-bold">
                                    Instant GPS Geo-Location & Camera Capture
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Capture road defects in seconds. Automatic HTML5 GPS pinpointing with pin fine-tuning, severity selector, and instant upvoting.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 pt-0 grid gap-6 sm:grid-cols-3">
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <MapPin className="size-4 text-red-500" />
                                        HTML5 High-Accuracy GPS
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Acquires exact latitude & longitude with precision accuracy radius badge.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Camera className="size-4 text-blue-500" />
                                        Direct Photo Upload
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Uploadthing integration with browser compression & instant preview.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Users className="size-4 text-purple-500" />
                                        Community Upvotes
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Citizens upvote nearby reports to elevate priority score automatically.
                                    </p>
                                </div>
                                <div className="sm:col-span-3 flex justify-end pt-2">
                                    <Button asChild size="lg" className="rounded-xl px-6 gap-2">
                                        <Link href="/map?report=true">
                                            <span>Test Citizen Report Flow</span>
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'ai' && (
                        <Card className="relative overflow-hidden border-primary/20 bg-card/90 shadow-xl backdrop-blur-xl">
                            <CardHeader className="p-6 sm:p-8 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="bg-amber-500 text-white">
                                        AI Duplicate Engine
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">02 / Proximity Match</span>
                                </div>
                                <CardTitle className="text-2xl font-bold">
                                    AI Image & PostGIS Proximity Duplicate Detection
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Prevents redundant reports. Automatically identifies candidate duplicate pairs using spatial distance radiuses and visual similarity scores.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 pt-0 grid gap-6 sm:grid-cols-3">
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Layers className="size-4 text-amber-500" />
                                        PostGIS Spatial Radius
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Searches 50-meter radius around reported coordinates instantly.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Sparkles className="size-4 text-blue-500" />
                                        Visual Similarity Score
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Calculates confidence match percentage for officer comparison.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <GitMerge className="size-4 text-emerald-500" />
                                        1-Click Consolidation
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Merges duplicate upvotes while dismissing false positives cleanly.
                                    </p>
                                </div>
                                <div className="sm:col-span-3 flex justify-end pt-2">
                                    <Button asChild size="lg" className="rounded-xl px-6 gap-2">
                                        <Link href="/municipality/dashboard">
                                            <span>Explore Duplicate Resolution</span>
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'officer' && (
                        <Card className="relative overflow-hidden border-primary/20 bg-card/90 shadow-xl backdrop-blur-xl">
                            <CardHeader className="p-6 sm:p-8 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="bg-blue-600 text-white">
                                        Municipal Officer Portal
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">03 / State Machine</span>
                                </div>
                                <CardTitle className="text-2xl font-bold">
                                    PostGIS Boundary Routing & Lifecycle State Machine
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Dedicated portal for city officers. Reports auto-route into jurisdictional boundaries with strict state machine transitions and audit logging.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 pt-0 grid gap-6 sm:grid-cols-3">
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Building2 className="size-4 text-blue-500" />
                                        Boundary Routing
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        PostGIS ST_Contains query maps coordinates to exact city municipal council.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <ShieldCheck className="size-4 text-emerald-500" />
                                        State Machine Policy
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Prevents invalid status jumps with required officer transition notes.
                                    </p>
                                </div>
                                <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Wrench className="size-4 text-amber-500" />
                                        Team Assignment
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Managers assign repair squads and track completion timestamps.
                                    </p>
                                </div>
                                <div className="sm:col-span-3 flex justify-end pt-2 gap-3">
                                    <Button asChild size="lg" variant="outline" className="rounded-xl px-5">
                                        <Link href="/admin/dashboard">
                                            <span>Super Admin Portal</span>
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" className="rounded-xl px-6 gap-2">
                                        <Link href="/municipality/dashboard">
                                            <span>Officer Portal Demo</span>
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </ScrollAppear>
            </div>
        </section>
    );
}
