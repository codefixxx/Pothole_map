'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { Badge } from '@/src/components/ui/badge';
import { MapPin, Shield, HelpCircle, FileText, Heart, ExternalLink, Globe } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur-md text-foreground/80 py-10 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Info */}
                    <div className="space-y-3 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Logo className="h-7" />
                        </Link>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            PotholeMap Production Platform (v2). Real-time civic hazard reporting, PostGIS jurisdictional routing, state machine lifecycle management, and officer triage.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                System Status: Operational
                            </Badge>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Platform</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href="/map" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <MapPin className="size-3 text-amber-500" />
                                    <span>Interactive Map</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                    Citizen Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/municipality/dashboard" className="hover:text-foreground transition-colors">
                                    Municipality Triage Portal
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">
                                    Super Admin Portal
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources & Help */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Resources</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href="/help" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <HelpCircle className="size-3 text-blue-500" />
                                    <span>Help & Civic Guide</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <Shield className="size-3 text-emerald-500" />
                                    <span>Privacy Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <FileText className="size-3 text-purple-500" />
                                    <span>Terms of Service</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Civic Impact Notice */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Civic Impact</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Empowering citizens and municipal authorities to collaborate on urban infrastructure repairs with transparent PostGIS containment checks and real-time updates.
                        </p>
                    </div>
                </div>

                <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
                    <p>© {new Date().getFullYear()} PotholeMap Production Platform. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-[11px]">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        <span>•</span>
                        <Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
