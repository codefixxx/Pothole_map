import Link from 'next/link';
import { Button } from '@/src/components/ui/button';

const Page = () => {
    return (
        <div className="p-4 flex flex-col items-center justify-center h-screen gap-6">
            <h1 className="text-2xl font-bold">Reset link sent</h1>
            <p>Your password reset link has been sent successfully</p>
            <Button variant="outline" asChild>
                <Link href="/auth/login">Go back to Login</Link>
            </Button>
        </div>
    );
};

export default Page;
