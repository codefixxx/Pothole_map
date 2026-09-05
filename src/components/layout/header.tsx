'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { Menu, X, MapPin, Sparkles, Layers, BarChart3, ArrowRight, ShieldCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useScroll } from 'motion/react';
import { useSession } from '@/src/lib/auth-client';
import { DropdownMenuAvatar } from './dropdown-menu-avatar';
import { ThemeToggle } from './theme-toggle';
import { User, Session } from 'better-auth';

const menuItems = [
    { name: 'Live Map', href: '/map', isLive: true, icon: MapPin },
    { name: 'Features', href: '/#features', icon: Sparkles },
    { name: 'Solution', href: '/#solution', icon: Layers },
    { name: 'Statistics', href: '/#stats', icon: BarChart3 },
];

interface HeroHeaderProps {
    initialSession: { session: Session; user: User } | null;
}

export const HeroHeader = ({ initialSession }: HeroHeaderProps) => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [scrolled, setScrolled] = useState<boolean>(false);

    const { scrollYProgress } = useScroll();

    useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.03);
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const { data: session } = useSession();
    const currentSession = session ?? initialSession;

    return (
        <header className="fixed top-0 inset-x-0 z-50 transition-all duration-200">
            <nav
                className={cn(
                    'w-full border-b transition-all duration-200',
                    scrolled || menuOpen
                        ? 'border-border/70 bg-background/85 backdrop-blur-md shadow-xs'
                        : 'border-transparent bg-transparent'
                )}
            >
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Left: Brand Logo */}
                        <div className="flex items-center gap-8">
                            <Link
                                href="/"
                                aria-label="PotholeMap Home"
                                className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
                            >
                                <Logo className="h-8 w-auto transition-transform duration-200 group-hover:scale-105" />
                                <span className="font-bold text-lg tracking-tight text-foreground">
                                    Pothole<span className="text-amber-500 dark:text-amber-400">Map</span>
                                </span>
                            </Link>

                            {/* Desktop Nav Links */}
                            <div className="hidden md:flex items-center gap-1 lg:gap-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                            item.isLive
                                                ? 'text-foreground hover:bg-accent/60'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                        )}
                                    >
                                        {item.isLive && (
                                            <span className="relative flex size-2 mr-0.5">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                                            </span>
                                        )}
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Map CTA Button on desktop */}
                            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 h-9 shadow-xs font-medium">
                                <Link href="/map">
                                    <MapPin className="size-3.5" />
                                    <span>Explore Map</span>
                                </Link>
                            </Button>

                            {/* Report Hazard CTA */}
                            <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5 h-9 shadow-xs font-medium bg-amber-600 hover:bg-amber-700 text-white">
                                <Link href="/map?report=true">
                                    <PlusCircle className="size-3.5" />
                                    <span>Report Hazard</span>
                                </Link>
                            </Button>

                            {/* Auth Actions / Avatar */}
                            {currentSession ? (
                                <DropdownMenuAvatar
                                    imageUrl={currentSession.user.image}
                                    name={currentSession.user.name}
                                />
                            ) : (
                                <div className="hidden items-center gap-2 sm:flex">
                                    <Button asChild variant="ghost" size="sm" className="h-9 text-sm">
                                        <Link href="/auth/login">Login</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="h-9 text-sm border-border/80">
                                        <Link href="/auth/register">Sign Up</Link>
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Hamburger Toggle */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
                                className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 p-1.5 text-muted-foreground hover:text-foreground md:hidden"
                            >
                                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Slide-Down Menu */}
                {menuOpen && (
                    <div className="border-t border-border/60 bg-background/95 px-4 pt-3 pb-6 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="size-4 text-muted-foreground" />
                                            <span>{item.name}</span>
                                        </div>
                                        {item.isLive && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-2">
                            <Button asChild size="sm" variant="outline" className="w-full justify-center gap-1.5 h-10 shadow-xs">
                                <Link href="/map" onClick={() => setMenuOpen(false)}>
                                    <MapPin className="size-4" />
                                    <span>Explore Live Map</span>
                                </Link>
                            </Button>

                            <Button asChild size="sm" className="w-full justify-center gap-1.5 h-10 shadow-xs bg-amber-600 hover:bg-amber-700 text-white">
                                <Link href="/map?report=true" onClick={() => setMenuOpen(false)}>
                                    <PlusCircle className="size-4" />
                                    <span>Report Road Hazard</span>
                                </Link>
                            </Button>

                            {!currentSession && (
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <Button asChild variant="outline" size="sm" className="w-full justify-center h-9">
                                        <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                                            Login
                                        </Link>
                                    </Button>
                                    <Button asChild variant="secondary" size="sm" className="w-full justify-center h-9">
                                        <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                                            Sign Up
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};
