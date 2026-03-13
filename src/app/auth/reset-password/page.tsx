import ResetPassword from '@/src/components/reset-password'
import { Button } from '@/src/components/ui/button';
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}
const ResetPasswordPage = async ({ searchParams }: PageProps) => {
  const token = (await searchParams).token
  const error = (await searchParams).error
  if (error) {

    return (
      <div className="min-h-screen flex flex-col items-center w-full justify-center gap-5 p-4">
        <h1 className="text-3xl font-bold ">Reset Password</h1>
        <p className="text-center text-destructive">
          Your reset password token is invalid or has expired. Please request a new password reset email.
        </p>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Go back to Login</Link>
        </Button>
      </div>

    )
  }
  return <ResetPassword token={!token ? "" : token} />
}

export default ResetPasswordPage