'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Bell, BellRing, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/src/lib/auth-client';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export interface FollowButtonProps {
    potholeId: string;
    initialFollowing?: boolean;
    size?: 'sm' | 'default';
    variant?: 'outline' | 'secondary' | 'ghost' | 'default';
    className?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
    potholeId,
    initialFollowing = false,
    size = 'sm',
    variant = 'outline',
    className,
    onFollowChange,
}: FollowButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowing);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        setIsFollowing(initialFollowing);
    }, [initialFollowing]);

    // Query follow status for logged-in user
    useEffect(() => {
        let isMounted = true;
        async function checkFollow() {
            if (!session?.user) return;
            try {
                const res = await fetch(`/api/potholes/${potholeId}/follow`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.success && data?.data && isMounted) {
                        setIsFollowing(!!data.data.following);
                    }
                }
            } catch {
                // Ignore silent background check failure
            }
        }

        checkFollow();
        return () => {
            isMounted = false;
        };
    }, [potholeId, session?.user?.id]);

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        // If not logged in, prompt sign in
        if (!session?.user) {
            toast.error('Please sign in to follow hazard updates and repair notifications.', {
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/login'),
                },
            });
            return;
        }

        const previousState = isFollowing;
        const nextState = !isFollowing;

        // Optimistic update
        setIsFollowing(nextState);
        onFollowChange?.(nextState);
        setIsLoading(true);

        try {
            const method = nextState ? 'POST' : 'DELETE';
            const res = await fetch(`/api/potholes/${potholeId}/follow`, { method });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update follow status');
            }

            toast.success(
                nextState
                    ? 'Now following! You will receive notifications when repair progress updates.'
                    : 'Unfollowed report.'
            );
        } catch (err: any) {
            // Revert on failure
            setIsFollowing(previousState);
            onFollowChange?.(previousState);
            toast.error(err.message || 'Failed to update notification subscription.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            size={size}
            variant={isFollowing ? 'secondary' : variant}
            onClick={handleToggleFollow}
            disabled={isLoading}
            className={cn(
                'group relative transition-all duration-200 gap-1.5 select-none',
                isFollowing
                    ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                    : 'hover:border-primary/40 hover:text-foreground',
                size === 'sm' && 'h-8 px-3 text-xs',
                className
            )}
            title={isFollowing ? 'Click to stop receiving notifications for this report' : 'Follow to receive notifications on repair progress'}
        >
            {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
            ) : isFollowing ? (
                <BellRing className="size-3.5 text-primary fill-primary/20 animate-pulse" />
            ) : (
                <Bell className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
            )}

            <span className="font-medium">
                {isFollowing ? 'Following' : 'Follow'}
            </span>
        </Button>
    );
}
