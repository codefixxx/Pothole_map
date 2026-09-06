'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import {
    MessageSquare,
    Send,
    Loader2,
    LogIn,
    User,
    Shield,
    Clock,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/src/lib/auth-client';
import { useRouter } from 'next/navigation';
import { formatRelativeTime, cn } from '@/src/lib/utils';

export interface CommentItem {
    id: string;
    content: string;
    createdAt: string | Date;
    user?: {
        id?: string;
        name?: string | null;
        image?: string | null;
        role?: string;
    } | null;
}

export interface CommentThreadProps {
    potholeId: string;
    initialComments?: CommentItem[];
    reporterId?: string;
    className?: string;
}

const MAX_COMMENT_LENGTH = 500;

export function CommentThread({
    potholeId,
    initialComments = [],
    reporterId,
    className,
}: CommentThreadProps) {
    const { data: session } = useSession();
    const router = useRouter();

    const [comments, setComments] = useState<CommentItem[]>(initialComments);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Synchronize initial comments prop
    useEffect(() => {
        if (initialComments?.length > 0 && comments.length === 0) {
            setComments(initialComments);
        }
    }, [initialComments]);

    // Fetch latest comments from API on mount
    useEffect(() => {
        let isMounted = true;
        async function fetchComments() {
            try {
                const res = await fetch(`/api/potholes/${potholeId}/comments`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data) && isMounted) {
                        setComments(json.data);
                    }
                }
            } catch {
                // Keep initialComments fallback
            }
        }

        fetchComments();
        return () => {
            isMounted = false;
        };
    }, [potholeId]);

    const charactersLeft = MAX_COMMENT_LENGTH - content.length;
    const isOverLimit = charactersLeft < 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast.error('Please enter a comment.');
            return;
        }

        if (isOverLimit) {
            toast.error(`Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters.`);
            return;
        }

        if (!session?.user) {
            toast.error('Please sign in to post a comment.', {
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/login'),
                },
            });
            return;
        }

        setIsSubmitting(true);
        const trimmedContent = content.trim();

        // Optimistic comment item
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: CommentItem = {
            id: tempId,
            content: trimmedContent,
            createdAt: new Date().toISOString(),
            user: {
                id: session.user.id,
                name: session.user.name || 'You',
                image: session.user.image || null,
            },
        };

        setComments((prev) => [optimisticComment, ...prev]);
        setContent('');

        try {
            const res = await fetch(`/api/potholes/${potholeId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: trimmedContent }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to submit comment');
            }

            // Replace optimistic item with server response
            setComments((prev) =>
                prev.map((c) => (c.id === tempId ? data.data : c))
            );
            toast.success('Civic comment logged successfully!');
        } catch (err: any) {
            // Rollback optimistic comment
            setComments((prev) => prev.filter((c) => c.id !== tempId));
            setContent(trimmedContent); // Restore text
            toast.error(err.message || 'Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className={cn('border-border/70 bg-card/60 backdrop-blur-xs', className)}>
            <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <MessageSquare className="size-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold text-foreground">
                                Civic Discussion & Updates
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Community observations, commuter hazards, and municipal dispatch notes
                            </CardDescription>
                        </div>
                    </div>

                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                        {comments.length} {comments.length === 1 ? 'Note' : 'Notes'}
                    </Badge>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Comment Submission Form */}
                {session?.user ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Avatar className="size-8 border border-border shrink-0 mt-0.5">
                                <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                                <AvatarFallback className="text-[11px] font-semibold bg-muted">
                                    {(session.user.name || 'U').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1.5">
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Add community context, depth changes, or repair status..."
                                    rows={3}
                                    disabled={isSubmitting}
                                    className="resize-none text-xs leading-relaxed"
                                />

                                <div className="flex items-center justify-between pt-1">
                                    <span
                                        className={cn(
                                            'text-[11px] font-mono tabular-nums',
                                            charactersLeft < 50
                                                ? charactersLeft < 0
                                                    ? 'text-destructive font-semibold'
                                                    : 'text-amber-500 font-medium'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {content.length}/{MAX_COMMENT_LENGTH} characters
                                    </span>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmitting || !content.trim() || isOverLimit}
                                        className="gap-1.5 h-8 text-xs font-medium px-3"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Send className="size-3.5" />
                                        )}
                                        <span>Post Update</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center space-y-2">
                        <div className="text-xs text-muted-foreground">
                            Have updates on this pothole or road conditions? Join the community discussion.
                        </div>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5"
                        >
                            <a href="/auth/login">
                                <LogIn className="size-3.5" />
                                <span>Sign In to Post Updates</span>
                            </a>
                        </Button>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-3 pt-2">
                    {comments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs space-y-1">
                            <p className="font-medium text-foreground/80">No civic notes recorded yet.</p>
                            <p>Be the first to confirm hazard depth, water accumulation, or repair progress.</p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const isReporter = reporterId && comment.user?.id === reporterId;
                            const isOfficial =
                                comment.user?.role === 'OFFICER' ||
                                comment.user?.role === 'ADMIN' ||
                                comment.user?.name?.toLowerCase().includes('municipal') ||
                                comment.user?.name?.toLowerCase().includes('dispatch');

                            return (
                                <div
                                    key={comment.id}
                                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-xs transition-colors hover:border-border/80"
                                >
                                    <Avatar className="size-7 border border-border/70 shrink-0 mt-0.5">
                                        <AvatarImage src={comment.user?.image || undefined} alt={comment.user?.name || 'User'} />
                                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                            {(comment.user?.name || 'U').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-semibold text-foreground text-xs truncate">
                                                    {comment.user?.name || 'Citizen Contributor'}
                                                </span>

                                                {isReporter && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 bg-primary/10 text-primary font-normal">
                                                        Reporter
                                                    </Badge>
                                                )}

                                                {isOfficial && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-normal">
                                                        Municipal
                                                    </Badge>
                                                )}
                                            </div>

                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {formatRelativeTime(comment.createdAt)}
                                            </span>
                                        </div>

                                        <p className="text-foreground/90 leading-relaxed break-words whitespace-pre-line text-xs">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
