import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import ResetPasswordForm from '@/src/components/reset-password-form';

type ResetPasswordFormProps = {
    token: string;
};
const ResetPassword = ({ token }: ResetPasswordFormProps) => {
    return (
        <div className="relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
            <Card className="z-1 w-full border-none shadow-md sm:max-w-md">
                <CardHeader className="gap-6">
                    <div>
                        <CardTitle className="mb-1.5 text-2xl">
                            Reset Password
                        </CardTitle>
                        <CardDescription className="text-base">
                            Please enter your current password and choose a new
                            password to update your account security.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* ResetPassword Form */}
                    <ResetPasswordForm token={token} />
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

export default ResetPassword;
