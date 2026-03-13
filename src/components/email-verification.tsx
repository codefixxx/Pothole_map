import { ChevronLeftIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import EmailVerificationForm from '@/src/components/send-email-verification-form';
import Link from 'next/link';

const EmailVerification = () => {
    return (
        <div className="relative flex h-auto w-full items-center justify-center overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <Card className="z-1 w-full border-none shadow-md sm:max-w-md">
                <CardHeader className="gap-4">
                    <div>
                        <CardTitle className="mb-1.5 text-2xl">
                            Verify Email Address
                        </CardTitle>
                        <CardDescription className="text-base">
                            Enter your email and we&apos;ll send you a link to
                            verify your email address
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email Verification Form */}
                    <EmailVerificationForm />
                    <Link
                        href="/auth/login"
                        className="group mx-auto flex w-fit items-center gap-2"
                    >
                        <ChevronLeftIcon className="size-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span>Back to login</span>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmailVerification;
