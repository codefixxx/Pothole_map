


import EmailVerification from "@/src/components/email-verification"
import { redirect } from "next/navigation"

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
const Page = async ({ searchParams }: PageProps) => {
    const params = await searchParams;
    const error = params.error as string | undefined
    if (!error) {
        redirect("/dashboard")
    }
    return (

        <div className="min-h-screen flex flex-col items-center w-full justify-center gap-5 p-4">
            <h1 className="text-3xl font-bold ">Verify Email</h1>
            <p className="text-center text-destructive">
                {
                    error === "invalid_token" || error === "token_expired" ? "Your token is invalid or has expired."
                        : error === "email_not_verified" ? "Your email is not verified. Please check your inbox or send a new verification email."
                            : "An unknown error occurred during verification. Please try again."
                }
            </p>
            <EmailVerification />
        </div>

    )
}

export default Page