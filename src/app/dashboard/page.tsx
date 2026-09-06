import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/src/components/layout/logo';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';
import { DropdownMenuAvatar } from '@/src/components/layout/dropdown-menu-avatar';
import { CitizenDashboardView } from '@/src/components/dashboard';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
    MapPin,
    ChevronRight,
    Home,
    LayoutDashboard,
    PlusCircle,
    Shield,
} from 'lucide-react';

export const metadata = {
    title: 'Citizen Activity Dashboard | PotholeMap',
    description: 'Track your reported road hazards, confirmations, followed repairs, and personal civic impact.',
};

export default async function DashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ demo?: string }> | { demo?: string };
}) {
    const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
    const isDemo = resolvedSearchParams?.demo === 'true';

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session && !isDemo) {
        redirect('/auth/login?callbackUrl=/dashboard');
    }

    const currentUser = session?.user || {
        id: 'demo-citizen-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        role: 'USER',
        image: null,
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation Shell */}
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Logo className="h-7 w-auto" />
                        <span className="font-bold text-base tracking-tight hidden sm:inline text-foreground">
                            Pothole<span className="text-amber-500">Map</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium">
                        <LayoutDashboard className="size-3 text-primary" />
                        <span className="text-foreground/80">Civic Dashboard</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5 h-8 text-xs font-medium">
                        <Link href="/map">
                            <MapPin className="size-3.5 text-primary" />
                            <span>Live Map</span>
                        </Link>
                    </Button>

                    <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5 h-8 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white">
                        <Link href="/map?report=true">
                            <PlusCircle className="size-3.5" />
                            <span>Report Hazard</span>
                        </Link>
                    </Button>

                    {currentUser.role === 'ADMIN' && (
                        <Button asChild variant="secondary" size="sm" className="hidden lg:inline-flex gap-1.5 h-8 text-xs">
                            <Link href="/admin/dashboard">
                                <Shield className="size-3.5" />
                                <span>Admin Portal</span>
                            </Link>
                        </Button>
                    )}

                    <ThemeToggle />

                    <DropdownMenuAvatar
                        name={currentUser.name || undefined}
                        imageUrl={currentUser.image}
                    />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Home className="size-3.5" />
                        <span>Home</span>
                    </Link>
                    <ChevronRight className="size-3" />
                    <span className="text-foreground font-medium flex items-center gap-1">
                        <LayoutDashboard className="size-3 text-primary" />
                        Civic Activity Hub
                    </span>
                </nav>

                <CitizenDashboardView />
            </main>
        </div>
    );
}
