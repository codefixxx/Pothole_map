'use client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
    UserRoundPen,
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
} from 'lucide-react';
import { signOut } from '../lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface DropdownMenuAvatarProps {
    imageUrl?: string | null;
    name?: string;
}

export function DropdownMenuAvatar({
    imageUrl,
    name,
}: DropdownMenuAvatarProps) {
    const router = useRouter();
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleClick = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/auth/login');
                },
            },
        });
    };

    const initials =
        name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || 'NA';

    const avatarSrc = imageUrl ? `${imageUrl}?w=120&q=80` : undefined;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <Avatar className="size-9 overflow-hidden rounded-full border border-muted shadow-sm">
                        {avatarSrc && (
                            <AvatarImage
                                src={avatarSrc}
                                alt={name || 'User avatar'}
                                onLoad={() => setImgLoaded(true)}
                                className={`object-cover object-center transition-opacity duration-300 ${
                                    imgLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                        )}

                        <AvatarFallback
                            delayMs={imgLoaded ? 999999 : 200}
                            className="bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xs font-semibold"
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link
                            href="/profile-settings"
                            className="flex items-center gap-2"
                        >
                            <UserRoundPen className="size-4" />
                            Profile
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2">
                        <CreditCardIcon className="size-4" />
                        Billing
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2">
                        <BellIcon className="size-4" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive"
                    onSelect={handleClick}
                >
                    <LogOutIcon className="size-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
