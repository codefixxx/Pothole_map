import { SettingsProfile } from '@/src/components/auth';
import { auth } from '@/src/lib/auth';
import { getMunicipalityMember } from '@/src/lib/auth-helpers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const Page = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/auth/login');

    const member = await getMunicipalityMember(session.user.id);

    const effectiveRole = session.user.role === 'ADMIN'
        ? 'ADMIN'
        : member?.role
        ? member.role
        : 'USER';

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-background">
            <SettingsProfile
                defaultValues={{
                    name: session.user.name ?? '',
                    email: session.user.email ?? '',
                    role: effectiveRole,
                    municipalityName: member?.municipality?.name ?? undefined,
                    emailVerified: session.user.emailVerified ?? false,
                    avatar: session.user.image ?? undefined,
                }}
            />
        </div>
    );
};

export default Page;