'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { FieldDescription } from './ui/field';
import { resetPassword } from '@/src/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { resetPasswordSchema } from '@/src/lib/validations/auth.shema';
import { z } from 'zod';

type ResetPasswordFormProps = {
    token: string;
};
const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
    const router = useRouter();
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
        useState<boolean>(false);
    const [isPending, setIsPending] = useState<boolean>(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);

        const data = Object.fromEntries(formData.entries());
        const result = resetPasswordSchema.safeParse(data);

        if (!result.success) {
            const errors = z.flattenError(result.error).fieldErrors;
            const firstError =
                Object.values(errors).flat()[0] || 'Invalid form data';
            toast.error(firstError);
            return;
        }

        await resetPassword(
            {
                newPassword: result.data.password,
                token: token,
            },
            {
                onRequest: () => setIsPending(true),
                onSuccess: () => {
                    setIsPending(false);
                    toast.success('Password reset successfully.');
                    router.push('/auth/login');
                },
                onResponse: () => {
                    setIsPending(false);
                },
                onError: (ctx) => {
                    setIsPending(false);
                    toast.error(
                        ctx.error?.message ?? 'Failed to reset password',
                    );
                },
            },
        );
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Password */}
            <div className="w-full space-y-1">
                <Label className="leading-5" htmlFor="password">
                    New Password
                </Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder="••••••"
                        className="pr-9"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() =>
                            setIsPasswordVisible((prevState) => !prevState)
                        }
                        className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                    >
                        {isPasswordVisible ? <EyeOff /> : <Eye />}
                        <span className="sr-only">
                            {isPasswordVisible
                                ? 'Hide password'
                                : 'Show password'}
                        </span>
                    </Button>
                </div>
                <FieldDescription>
                    Must be at least 6 characters long.
                </FieldDescription>
            </div>

            {/* Confirm Password */}
            <div className="w-full space-y-1">
                <Label className="leading-5" htmlFor="confirmPassword">
                    Confirm Password
                </Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={isConfirmPasswordVisible ? 'text' : 'password'}
                        placeholder="••••••"
                        className="pr-9"
                    />
                    <Button
                        variant="ghost"
                        type="button"
                        size="icon"
                        onClick={() =>
                            setIsConfirmPasswordVisible(
                                (prevState) => !prevState,
                            )
                        }
                        className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                    >
                        {isConfirmPasswordVisible ? <EyeOff /> : <Eye />}
                        <span className="sr-only">
                            {isConfirmPasswordVisible
                                ? 'Hide password'
                                : 'Show password'}
                        </span>
                    </Button>
                </div>
            </div>

            <Button className="w-full" type="submit" disabled={isPending}>
                Set New Password
            </Button>
        </form>
    );
};

export default ResetPasswordForm;
