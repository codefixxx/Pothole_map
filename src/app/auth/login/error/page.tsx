
import Link from "next/link"
import { Button } from "@/src/components/ui/button"

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
     <h1 className="text-2xl font-bold">Login Error</h1>
        <p>There was an error during the login process. Please try again.</p>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Go back to Login</Link>
        </Button>
    </div>
    
  )
}

export default Page