import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { CheckCircle2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo, ThemeToggle } from '@/src/components/layout';

const Page = () => {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Top Corner Controls */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Brand Logo */}
            <Link href="/" className="mb-6 flex items-center gap-2 group transition-transform hover:scale-105">
                <Logo className="h-9" />
                <span className="font-bold text-xl tracking-tight text-foreground">
                    Pothole<span className="text-amber-500 dark:text-amber-400">Map</span>
                </span>
            </Link>

            {/* Success Card */}
            <Card className="w-full max-w-md shadow-2xl border-emerald-500/20 dark:border-emerald-500/30 bg-card">
                <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="size-9" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Email Verified Successfully!
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your email address has been confirmed. Your account is now fully active with complete civic reporting capabilities.
                    </p>

                    <div className="rounded-xl border bg-muted/40 p-3.5 text-left text-xs space-y-2">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                            <span>Unlocked Account Features:</span>
                        </div>
                        <ul className="space-y-1 text-muted-foreground pl-6 list-disc text-[11px]">
                            <li>Submit instant GPS pothole hazard reports</li>
                            <li>Upvote community road hazard issues</li>
                            <li>Receive live repair resolution updates</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2.5 pt-4 pb-8">
                    <Button asChild size="lg" className="w-full font-semibold gap-2">
                        <Link href="/map">
                            <MapPin className="size-4" />
                            <span>Explore Map & Report Potholes</span>
                            <ArrowRight className="size-4 ml-auto" />
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                        <Link href="/auth/login">Continue to Account Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Page;