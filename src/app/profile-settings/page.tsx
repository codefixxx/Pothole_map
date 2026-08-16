import { SettingsProfile } from "../../components/update-profile"
import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const Page = async () => {
const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/auth/login');

  return (
    <div className="flex justify-center items-center min-h-screen"><SettingsProfile defaultValues={{
        name: session.user.name,
        username: session.user.username ?? undefined,
        avatar: session.user.image?? undefined,
    }} /></div>
   
  )
}

export default Page