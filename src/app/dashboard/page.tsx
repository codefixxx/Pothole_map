import { SignOutButton } from '@/src/components/ui/signout-button';
import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
const Page = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/auth/login');

    return (
        <div>
            <SignOutButton />
            {session.user.role === 'ADMIN' && (
                <div>
                    <Link href="/admin/dashboard">
                        <Button>Admin Dashboard</Button>
                    </Link>
                </div>
            )}
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
};

export default Page;
