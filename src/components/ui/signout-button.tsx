'use client'
import { Button } from '@/src/components/ui/button'
import { signOut } from '@/src/lib/auth-client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
    const router = useRouter()
    const handlClick = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/login"); // redirect to login page
                },
            }
        })
    }
    return (
        <Button onClick={handlClick} size="sm" >Sign out</Button>
    )
}

