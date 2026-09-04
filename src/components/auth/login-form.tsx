'use client';

import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { signIn } from '@/src/lib/auth-client';
import { toast } from 'sonner';
import { loginSchema } from '@/src/lib/validations/auth.shema';
import { z } from 'zod';
import { useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [isPending, setIsPending] = useState<boolean>(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());
        const result = loginSchema.safeParse(data);
        if (!result.success) {
            const errors = z.flattenError(result.error).fieldErrors;
            const firstError =
                Object.values(errors).flat()[0] || 'Invalid form data';
            toast.error(firstError);
            return;
        }
        await signIn.email(
            {
                email: result.data.email,
                password: result.data.password,
                callbackURL: '/dashboard',
            },
            {
                onRequest: (ctx) => {
                    setIsPending(true);
                },
                onSuccess: (ctx) => {
                    setIsPending(false);
                    toast.success('Login successful. Good to have you back.');
                    router.push('/dashboard');
                },
                onError: (ctx) => {
                    // display the error message
                    if (ctx?.error?.code === 'EMAIL_NOT_VERIFIED') {
                        redirect('/auth/verify?error=email_not_verified');
                    }
                    setIsPending(false);
                    toast.error(ctx.error?.message ?? 'Login failed');
                },
            },
        );
    };
    const handleSubmitWithGoogle = async () => {
        await signIn.social(
            {
                provider: 'google',
                callbackURL: '/dashboard',
                errorCallbackURL: '/auth/login/error',
            },
            {
                onRequest: () => setIsPending(true),
                onResponse: () => {
                    setIsPending(false);
                },
                onError: (ctx) => {
                    setIsPending(false);
                    toast.error(ctx.error?.message ?? 'Google login failed');
                },
            },
        );
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="m@example.com"
                                    required
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
                                    <Link
                                        href="/auth/forgot-password"
                                        className="ml-auto text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={
                                            isPasswordVisible
                                                ? 'text'
                                                : 'password'
                                        }
                                        required
                                        placeholder="••••••"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            setIsPasswordVisible(
                                                (prevState) => !prevState,
                                            )
                                        }
                                        className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                                    >
                                        {isPasswordVisible ? (
                                            <EyeOffIcon />
                                        ) : (
                                            <EyeIcon />
                                        )}
                                        <span className="sr-only">
                                            {isPasswordVisible
                                                ? 'Hide password'
                                                : 'Show password'}
                                        </span>
                                    </Button>
                                </div>
                            </Field>
                            <Field>
                                <Button type="submit" disabled={isPending}>
                                    Login
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={isPending}
                                    type="button"
                                    onClick={handleSubmitWithGoogle}
                                >
                                    Login with Google
                                </Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/auth/register">Sign up</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
