import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminDashboardView } from '@/src/components/admin';

export const metadata = {
    title: 'Super Admin Portal | PotholeMap',
    description: 'System-wide municipality CRUD, member role assignments, GeoJSON jurisdiction boundary manager, and platform metrics.',
};

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ demo?: string }> | { demo?: string };
}) {
    const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
    const isDemo = resolvedSearchParams?.demo === 'true';

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session && !isDemo) {
        redirect('/auth/login?callbackUrl=/admin/dashboard');
    }

    if (session && session.user.role !== 'ADMIN' && !isDemo) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-red-500/10 p-4 text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Super Admin privileges are required to access this portal. Contact platform administrator for elevation.
                </p>
            </div>
        );
    }

    const userName = session?.user?.name || (isDemo ? 'Super Admin Demo' : 'Administrator');

    return <AdminDashboardView userName={userName} isDemo={isDemo || !session} />;
}
