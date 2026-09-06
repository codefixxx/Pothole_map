'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/src/components/ui/sheet';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs';
import {
    NotificationItem,
    NotificationData,
} from './notification-item';
import {
    Bell,
    CheckCheck,
    RefreshCw,
    Inbox,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUnreadCountChange?: (count: number) => void;
}

export function NotificationSheet({
    open,
    onOpenChange,
    onUnreadCountChange,
}: NotificationSheetProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [markingAll, setMarkingAll] = useState<boolean>(false);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await fetch('/api/notifications?demo=true', {
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            if (data?.data) {
                setNotifications(data.data);
                const unread = data.data.filter((n: NotificationData) => !n.read).length;
                onUnreadCountChange?.(unread);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [onUnreadCountChange]);

    // Fetch on initial mount and whenever drawer opens
    useEffect(() => {
        if (open) {
            fetchNotifications(false);
        }
    }, [open, fetchNotifications]);

    // Initial background fetch once on mount to establish unread badge
    useEffect(() => {
        fetchNotifications(true);
    }, [fetchNotifications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications(true);
        toast.info('Notifications refreshed');
    };

    // Mark single notification as read
    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setMarkingId(id);

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        const nextUnread = notifications.filter((n) => n.id !== id && !n.read).length;
        onUnreadCountChange?.(nextUnread);

        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to mark read');
            toast.success('Marked as read');
        } catch {
            // Revert on error
            toast.error('Failed to mark notification as read');
            fetchNotifications(true);
        } finally {
            setMarkingId(null);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        if (unreadCount === 0) return;

        setMarkingAll(true);
        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onUnreadCountChange?.(0);

        try {
            const res = await fetch('/api/notifications?demo=true', {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
            fetchNotifications(true);
        } finally {
            setMarkingAll(false);
        }
    };

    // Click to navigate directly to report
    const handleClickNotification = async (notification: NotificationData) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            onOpenChange(false);
            router.push(notification.link);
        }
    };

    const unreadNotifications = notifications.filter((n) => !n.read);
    const displayedNotifications =
        activeTab === 'unread' ? unreadNotifications : notifications;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col p-0 sm:max-w-md border-l border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl"
            >
                {/* Drawer Header */}
                <SheetHeader className="border-b border-border/60 px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Bell className="size-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-bold tracking-tight">
                                    Civic Notifications
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground">
                                    Real-time hazard lifecycle updates & discussions
                                </SheetDescription>
                            </div>
                        </div>

                        {/* Unread Pill */}
                        {unreadNotifications.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-xs font-semibold px-2 py-0.5"
                            >
                                {unreadNotifications.length} unread
                            </Badge>
                        )}
                    </div>

                    {/* Filter Tabs and Quick Action Toolbar */}
                    <div className="flex items-center justify-between pt-1">
                        <Tabs
                            value={activeTab}
                            onValueChange={(val) => setActiveTab(val as 'all' | 'unread')}
                            className="w-auto"
                        >
                            <TabsList className="h-8 p-0.5 bg-muted/60">
                                <TabsTrigger value="all" className="h-7 text-xs px-2.5">
                                    All ({notifications.length})
                                </TabsTrigger>
                                <TabsTrigger value="unread" className="h-7 text-xs px-2.5">
                                    Unread ({unreadNotifications.length})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={refreshing || loading}
                                className="size-7 text-muted-foreground hover:text-foreground"
                                title="Refresh feed"
                            >
                                <RefreshCw
                                    className={`size-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`}
                                />
                            </Button>

                            {unreadNotifications.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    disabled={markingAll}
                                    className="h-7 text-[11px] gap-1 px-2 font-medium"
                                >
                                    <CheckCheck className="size-3 text-muted-foreground" />
                                    <span>Mark all read</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                {/* Notifications Scrollable List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-xl border border-border/50 p-3.5 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                        <Skeleton className="h-4 w-12 rounded-md" />
                                    </div>
                                    <Skeleton className="h-4 w-3/4 rounded-md" />
                                    <Skeleton className="h-8 w-full rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-6 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 border border-border/60 mb-3 text-muted-foreground">
                                {activeTab === 'unread' ? (
                                    <Sparkles className="size-6 text-amber-500" />
                                ) : (
                                    <Inbox className="size-6 opacity-60" />
                                )}
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">
                                {activeTab === 'unread'
                                    ? "You're all caught up!"
                                    : 'No notifications found'}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                                {activeTab === 'unread'
                                    ? 'All civic hazard alerts and discussions have been acknowledged.'
                                    : 'Follow reports or report road hazards to receive direct dispatch notifications.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {displayedNotifications.map((notif) => (
                                <NotificationItem
                                    key={notif.id}
                                    notification={notif}
                                    onMarkAsRead={handleMarkAsRead}
                                    onClickNotification={handleClickNotification}
                                    isMarking={markingId === notif.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">
                        Civic notifications sync automatically across verified municipal jurisdictions.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
