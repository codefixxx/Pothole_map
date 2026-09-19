import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { BorderTrail, ScrollAppear } from '@/src/components/motion';
import { MapPin, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CallToAction() {
    return (
        <section className="py-16 md:py-24">
            <ScrollAppear>
                <div className="mx-auto max-w-5xl rounded-3xl border border-primary/20 bg-gradient-to-b from-card via-card/80 to-background px-6 py-12 md:py-20 lg:py-24 relative overflow-hidden shadow-2xl backdrop-blur-xl text-center space-y-8">
                    <BorderTrail
                        className="absolute inset-0 rounded-3xl"
                        style={{
                            boxShadow:
                                '0px 0px 60px 30px rgba(59, 130, 246, 0.35), 0 0 100px 60px rgba(168, 85, 247, 0.25)',
                        }}
                        size={120}
                    />

                    <div className="space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-balance text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                            Help Make Roads Safer Today
                        </h2>

                        <p className="text-muted-foreground text-sm sm:text-base">
                            Join thousands of citizens and municipal officers improving infrastructure with real-time hazard mapping.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Button asChild size="lg" className="rounded-xl px-6 text-sm font-semibold shadow-lg shadow-primary/25 gap-2 h-12">
                            <Link href="/map?report=true">
                                <MapPin className="size-4" />
                                <span>Report a Road Hazard</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>

                        <Button asChild size="lg" variant="outline" className="rounded-xl px-6 text-sm font-medium h-12 gap-2">
                            <Link href="/municipality/dashboard">
                                <Building2 className="size-4 text-blue-500" />
                                <span>Officer Portal</span>
                            </Link>
                        </Button>

                        <Button asChild size="lg" variant="ghost" className="rounded-xl px-5 text-sm font-medium h-12 text-muted-foreground hover:text-foreground gap-1.5">
                            <Link href="/admin/dashboard">
                                <ShieldCheck className="size-4 text-purple-500" />
                                <span>Super Admin</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </ScrollAppear>
        </section>
    );
}
