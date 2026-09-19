import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { TextEffect } from '@/src/components/ui/text-effect';
import { AnimatedGroup } from '@/src/components/ui/animated-group';
import { LogoCloud } from './logo-cloud';
import { LiveMapShowcase } from './live-map-showcase';
import HeroHeaderWrapper from '@/src/components/layout/header-wrapper';
import { MapPin, ArrowRight, ShieldCheck, Building2, Sparkles } from 'lucide-react';

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.2,
            },
        },
    },
};

export default function HeroSection() {
    return (
        <>
            <HeroHeaderWrapper />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate hidden contain-strict lg:block pointer-events-none"
                >
                    <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(217,91%,60%,.12)_0,hsla(217,91%,45%,.03)_50%,transparent_80%)]" />
                    <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(270,91%,60%,.1)_0,hsla(270,91%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                </div>

                <section className="relative pt-20 md:pt-28 pb-12">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="mx-auto max-w-3xl text-center space-y-6">
                            <Badge variant="outline" className="px-3.5 py-1 text-xs gap-2 border-primary/30 text-primary bg-primary/10 rounded-full inline-flex items-center">
                                <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
                                <span>Real-Time Civic Infrastructure Platform</span>
                            </Badge>

                            <TextEffect
                                preset="fade-in-blur"
                                speedSegment={0.3}
                                as="h1"
                                className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl leading-tight"
                            >
                                Report & Track Road Hazards in Real Time
                            </TextEffect>

                            <TextEffect
                                per="line"
                                preset="fade-in-blur"
                                speedSegment={0.3}
                                delay={0.4}
                                as="p"
                                className="text-pretty text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
                            >
                                Empowering citizens and municipal authorities with instant GPS geo-location, AI duplicate matching, and PostGIS boundary routing.
                            </TextEffect>

                            <AnimatedGroup
                                variants={{
                                    container: {
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.08,
                                                delayChildren: 0.6,
                                            },
                                        },
                                    },
                                    ...transitionVariants,
                                }}
                                className="pt-4 flex flex-wrap items-center justify-center gap-3"
                            >
                                <Button
                                    key={1}
                                    asChild
                                    size="lg"
                                    className="rounded-xl px-6 text-base font-semibold shadow-lg shadow-primary/25 gap-2 h-12"
                                >
                                    <Link href="/map?report=true">
                                        <MapPin className="size-4" />
                                        <span>Report Pothole Now</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    key={2}
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="rounded-xl px-6 text-base font-medium h-12 backdrop-blur-sm"
                                >
                                    <Link href="/map">
                                        <span>Explore Live Map</span>
                                    </Link>
                                </Button>

                                <Button
                                    key={3}
                                    asChild
                                    size="lg"
                                    variant="ghost"
                                    className="rounded-xl px-5 text-sm font-medium h-12 text-muted-foreground hover:text-foreground gap-1.5"
                                >
                                    <Link href="/municipality/dashboard">
                                        <Building2 className="size-4 text-blue-500" />
                                        <span>Officer Portal</span>
                                    </Link>
                                </Button>
                            </AnimatedGroup>
                        </div>

                        {/* Interactive Live Map Showcase Replacement */}
                        <div className="mt-12 sm:mt-16">
                            <LiveMapShowcase />
                        </div>
                    </div>
                </section>

                <section className="bg-background/50 border-t border-border/40 py-12">
                    <div className="mx-auto max-w-5xl px-6">
                        <LogoCloud />
                    </div>
                </section>
            </main>
        </>
    );
}
