'use client'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { sendVerificationEmail } from '@/src/lib/auth-client'
import { send } from 'process'
import { useState } from 'react'
import {toast} from 'sonner'
import { useRouter } from 'next/navigation'
const EmailVerificationForm = () => {
  const router = useRouter()
  const [isPending, setIsPending] = useState<boolean>(false)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if(!email) {
      toast.error("Please enter your email address")
      return
    }
    await sendVerificationEmail({
      email,
      callbackURL: "/auth/verify"},
      {
        onRequest: (ctx) => {
        setIsPending(true)
      },
      onSuccess: (ctx) => {
        setIsPending(false)
        toast.success("Verification email sent. Please check your inbox.")
        router.push("/auth/verify/success")
      },
      onResponse: (ctx) => {
        setIsPending(false)
      },
      onError: (ctx) => {
        // display the error message
        setIsPending(false)
        toast.error(ctx.error?.message ?? "Failed to send verification email. Please try again.")
      },
      }
    )
  }
    return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {/* Email */}
      <div className='space-y-1'>
        <Label className='leading-5' htmlFor='userEmail'>
          Email address
        </Label>
        <Input type='email' name='email' id='userEmail' placeholder='Enter your email address' />
      </div>

      <Button className='w-full' type='submit' disabled={isPending}>
        Send Verification Link
      </Button>
    </form>
  )
}
export default EmailVerificationForm
