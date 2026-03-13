'use client'
import { signupSchema } from "@/src/lib/validations/auth.shema"
import { Button } from "@/src/components/ui/button"
import { toast } from "sonner"
import { z } from "zod"
import { signUp, signIn } from "@/src/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"



export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false)
  const router = useRouter()
  const [isPending, setIsPending] = useState<boolean>(false)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)

    const data = Object.fromEntries(formData.entries())
    const result = signupSchema.safeParse(data)
    if (!result.success) {
      const errors = z.flattenError(result.error).fieldErrors
      const firstError = Object.values(errors).flat()[0] || "Invalid form data"
      toast.error(firstError)
      return
    }

    await signUp.email({
      email: result.data.email,
      password: result.data.password,
      name: result.data.name,
      callbackURL: "/dashboard"
    },
      {
        onRequest: (ctx) => {
          setIsPending(true)

        },
        onSuccess: (ctx) => {
          //redirect to the dashboard or sign in page
          setIsPending(false)
          toast.success("Signup successful. Please check your email to verify your account.")
          router.push("/auth/register/success")
        },
        onError: (ctx) => {
          if (ctx.error?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
            toast.error("Something went wrong")
          } else {
            toast.error(ctx.error?.message ?? "Signup failed")
          }
          setIsPending(false)
        }
      }

    )

  }

  const handleSubmitWithGoogle = async () => {

    await signIn.social(
      { provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/auth/login" },
      {
        onRequest: () => setIsPending(true),
        onResponse: () => {
          setIsPending(false)
        },
        onError: (ctx) => {
          setIsPending(false)
          toast.error(ctx.error?.message ?? "Google login failed")
        },
      }
    )
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" name="name" type="text" placeholder="John Doe" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input id="password" name="password" type={isPasswordVisible ? 'text' : 'password'} required placeholder="••••••" />
                <Button
                  variant='ghost'
                  size='icon'
                  type="button"
                  onClick={() => setIsPasswordVisible(prevState => !prevState)}
                  className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
                >
                  {isPasswordVisible ? <EyeOff/> : <Eye/>}
                  <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>

              <FieldDescription>
                Must be at least 6 characters long.
              </FieldDescription>

            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input id="confirm-password" name="confirmPassword" type={isConfirmPasswordVisible ? 'text' : 'password'} required placeholder="••••••" />
                <Button
                  variant='ghost'
                  size='icon'
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(prevState => !prevState)}
                  className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
                >
                  {isConfirmPasswordVisible ? <EyeOff/> : <Eye/>}
                  <span className='sr-only'>{isConfirmPasswordVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isPending}>Create Account</Button>
                <Button variant="outline" type="button" disabled={isPending} onClick={handleSubmitWithGoogle}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/auth/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
