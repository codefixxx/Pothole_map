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
    LayoutDashboard,
    BellIcon,
    LogOutIcon,
    Building2,
    ShieldCheck,
} from 'lucide-react';
import { signOut, useSession } from '@/src/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { NotificationSheet } from '@/src/components/notifications/notification-sheet';

interface DropdownMenuAvatarProps {
    imageUrl?: string | null;
    name?: string;
    role?: string | null;
}

export function DropdownMenuAvatar({
    imageUrl,
    name,
    role,
}: DropdownMenuAvatarProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const effectiveRole = role ?? (session?.user as any)?.role;
    const normalizedRole = typeof effectiveRole === 'string' ? effectiveRole.toUpperCase() : undefined;
    const isSuperAdmin = normalizedRole === 'ADMIN';
    const isMunicipalStaff = isSuperAdmin || normalizedRole === 'OFFICER' || normalizedRole === 'MANAGER';

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

            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2"
                        >
                            <LayoutDashboard className="size-4 text-primary" />
                            <span>Civic Dashboard</span>
                        </Link>
                    </DropdownMenuItem>

                    {isSuperAdmin && (
                        <DropdownMenuItem asChild>
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2"
                            >
                                <ShieldCheck className="size-4 text-amber-500" />
                                <span>Super Admin Portal</span>
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {isMunicipalStaff && (
                        <DropdownMenuItem asChild>
                            <Link
                                href="/municipality/dashboard"
                                className="flex items-center gap-2"
                            >
                                <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Municipality Portal</span>
                            </Link>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                        <Link
                            href="/profile-settings"
                            className="flex items-center gap-2"
                        >
                            <UserRoundPen className="size-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onSelect={() => setShowNotifications(true)}
                    >
                        <BellIcon className="size-4" />
                        <span>Notifications</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                    onSelect={handleClick}
                >
                    <LogOutIcon className="size-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>

            <NotificationSheet
                open={showNotifications}
                onOpenChange={setShowNotifications}
            />
        </DropdownMenu>
    );
}
