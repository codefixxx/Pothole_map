import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import { MunicipalityDashboardView } from '@/src/components/municipality';

export const metadata = {
    title: 'Municipality Officer Dashboard & Triage Queue | PotholeMap',
    description: 'Jurisdictional road hazard triage, automated PostGIS boundary routing, state machine transitions, and team dispatch.',
};

export default async function MunicipalityDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ demo?: string }> | { demo?: string };
}) {
    const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
    const isDemo = resolvedSearchParams?.demo === 'true';

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session && !isDemo) {
        redirect('/auth/login?callbackUrl=/municipality/dashboard');
    }

    // Resolve user's municipality membership or fallback for demo
    let member = null;
    if (session) {
        member = await getMunicipalityMember(session.user.id);
        if (!member && session.user.role !== 'ADMIN' && !isDemo) {
            redirect('/dashboard?error=unauthorized_municipality');
        }
    }

    const userRole = member?.role || (session?.user?.role === 'ADMIN' ? 'ADMIN' : 'MANAGER');
    const userName = session?.user?.name || (isDemo ? 'Senior Inspector Rajesh Kumar' : 'Municipal Officer');
    const userImage = session?.user?.image || null;

    return (
        <MunicipalityDashboardView
            userRole={userRole}
            userName={userName}
            userImage={userImage}
            isDemo={isDemo || !session}
        />
    );
}
