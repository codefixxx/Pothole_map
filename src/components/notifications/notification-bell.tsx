'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { NotificationSheet } from './notification-sheet';

interface NotificationBellProps {
    className?: string;
    showLabel?: boolean;
}

export function NotificationBell({ className, showLabel = false }: NotificationBellProps) {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // Initial check for unread count
    useEffect(() => {
        let isMounted = true;
        const checkUnread = async () => {
            try {
                const res = await fetch('/api/notifications?demo=true', {
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const json = await res.json();
                if (isMounted && typeof json?.unreadCount === 'number') {
                    setUnreadCount(json.unreadCount);
                }
            } catch {
                // Ignore background polling errors
            }
        };

        checkUnread();

        // Optional gentle poll every 60 seconds
        const interval = setInterval(checkUnread, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <>
            <Button
                variant="ghost"
                size={showLabel ? 'sm' : 'icon'}
                onClick={() => setOpen(true)}
                aria-label={`Open notifications (${unreadCount} unread)`}
                className={cn(
                    'relative text-muted-foreground hover:text-foreground transition-colors',
                    showLabel ? 'gap-2 px-3' : 'size-9 rounded-lg',
                    className
                )}
                id="notification-bell-btn"
            >
                <div className="relative flex items-center justify-center">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-200">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                {showLabel && (
                    <span className="text-xs font-medium">Notifications</span>
                )}
            </Button>

            <NotificationSheet
                open={open}
                onOpenChange={setOpen}
                onUnreadCountChange={setUnreadCount}
            />
        </>
    );
}
