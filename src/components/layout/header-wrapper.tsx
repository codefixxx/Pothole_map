import { headers } from 'next/headers';
import { auth } from '@/src/lib/auth';
import { HeroHeader } from './header';

export default async function HeroHeaderWrapper() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return <HeroHeader initialSession={session} />;
}
