'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/src/lib/auth-client';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export interface UpvoteButtonProps {
    potholeId: string;
    initialVotesCount?: number;
    initialHasVoted?: boolean;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    showLabel?: boolean;
    className?: string;
    onVoteChange?: (newCount: number, hasVoted: boolean) => void;
}

export function UpvoteButton({
    potholeId,
    initialVotesCount = 0,
    initialHasVoted = false,
    size = 'sm',
    variant = 'outline',
    showLabel = true,
    className,
    onVoteChange,
}: UpvoteButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [votesCount, setVotesCount] = useState<number>(initialVotesCount);
    const [hasVoted, setHasVoted] = useState<boolean>(initialHasVoted);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Synchronize initial prop changes
    useEffect(() => {
        setVotesCount(initialVotesCount);
    }, [initialVotesCount]);

    useEffect(() => {
        setHasVoted(initialHasVoted);
    }, [initialHasVoted]);

    // Check current vote status from API on mount
    useEffect(() => {
        let isMounted = true;
        async function fetchVoteStatus() {
            try {
                const res = await fetch(`/api/potholes/${potholeId}/votes`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.success && data?.data && isMounted) {
                        if (typeof data.data.count === 'number') {
                            setVotesCount(data.data.count);
                        }
                        if (typeof data.data.hasVoted === 'boolean') {
                            setHasVoted(data.data.hasVoted);
                        }
                    }
                }
            } catch {
                // Ignore silent background check failure
            }
        }

        fetchVoteStatus();
        return () => {
            isMounted = false;
        };
    }, [potholeId, session?.user?.id]);

    const handleToggleVote = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        // If not logged in, prompt sign in
        if (!session?.user) {
            toast.error('Please sign in to upvote and confirm road hazards.', {
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/login'),
                },
            });
            return;
        }

        const previousVoted = hasVoted;
        const previousCount = votesCount;

        const nextVoted = !hasVoted;
        const nextCount = nextVoted ? previousCount + 1 : Math.max(0, previousCount - 1);

        // Optimistic update
        setHasVoted(nextVoted);
        setVotesCount(nextCount);
        onVoteChange?.(nextCount, nextVoted);

        setIsLoading(true);

        try {
            const method = nextVoted ? 'POST' : 'DELETE';
            const res = await fetch(`/api/potholes/${potholeId}/votes`, { method });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update vote');
            }

            toast.success(
                nextVoted
                    ? 'Report confirmed! You boosted this pothole’s repair priority.'
                    : 'Confirmation vote removed.'
            );
        } catch (err: any) {
            // Revert state on error
            setHasVoted(previousVoted);
            setVotesCount(previousCount);
            onVoteChange?.(previousCount, previousVoted);
            toast.error(err.message || 'Failed to update confirmation vote.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            size={size}
            variant={hasVoted ? 'default' : variant}
            onClick={handleToggleVote}
            disabled={isLoading}
            className={cn(
                'group relative transition-all duration-200 gap-1.5 select-none',
                hasVoted
                    ? 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90'
                    : 'hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
                size === 'sm' && 'h-8 px-3 text-xs',
                className
            )}
            title={hasVoted ? 'Click to withdraw your confirmation vote' : 'Confirm this hazard exists to escalate priority'}
        >
            {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
            ) : (
                <ThumbsUp
                    className={cn(
                        'size-3.5 transition-transform duration-200 group-hover:scale-110',
                        hasVoted && 'fill-current scale-105'
                    )}
                />
            )}
            <span className="font-semibold tabular-nums">{votesCount}</span>
            {showLabel && (
                <span className="hidden sm:inline font-normal">
                    {votesCount === 1 ? 'Confirmation' : 'Confirmations'}
                </span>
            )}
        </Button>
    );
}
