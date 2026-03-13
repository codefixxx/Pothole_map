import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/src/components/ui/signout-button';

const page = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/auth/login');
    if (session.user.role !== 'ADMIN') {
        return (
            <>
                <div className="text-2xl">Admin dashboard</div>
                <div className="text-2xl bg-red-600">Forbidden</div>
            </>
        );
    }
    return (
        <>
            <div>
                <SignOutButton />
            </div>
            <div className="text-2xl">Admin dashboard</div>
            <div className="text-2xl">
                Hello {session.user.name}, You are an admin
            </div>
        </>
    );
};

export default page;
