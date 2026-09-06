'use client';

import React from 'react';
import {
    CheckCircle2,
    GitMerge,
    MessageSquare,
    CheckCheck,
    Bell,
    Check,
    ArrowUpRight,
    Loader2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { cn, formatRelativeTime } from '@/src/lib/utils';

export interface NotificationData {
    id: string;
    title: string;
    message: string;
    link?: string | null;
    read: boolean;
    createdAt: string;
}

export type NotificationCategory =
    | 'STATUS_UPDATE'
    | 'DUPLICATE_MERGE'
    | 'NEW_COMMENT'
    | 'REPAIR_COMPLETED'
    | 'GENERAL';

export function getNotificationCategory(title: string, message: string): NotificationCategory {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('repair') || text.includes('completed') || text.includes('resurfaced') || text.includes('resolved')) {
        return 'REPAIR_COMPLETED';
    }
    if (text.includes('duplicate') || text.includes('merge')) {
        return 'DUPLICATE_MERGE';
    }
    if (text.includes('comment') || text.includes('discussion') || text.includes('replied')) {
        return 'NEW_COMMENT';
    }
    if (
        text.includes('verified') ||
        text.includes('status') ||
        text.includes('triage') ||
        text.includes('assigned') ||
        text.includes('in-progress') ||
        text.includes('under review')
    ) {
        return 'STATUS_UPDATE';
    }
    return 'GENERAL';
}

const CATEGORY_CONFIG: Record<
    NotificationCategory,
    {
        label: string;
        icon: React.ElementType;
        badgeClass: string;
        iconBg: string;
        iconColor: string;
    }
> = {
    REPAIR_COMPLETED: {
        label: 'Repair Done',
        icon: CheckCheck,
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    DUPLICATE_MERGE: {
        label: 'Duplicate Merged',
        icon: GitMerge,
        badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
        iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        iconColor: 'text-orange-600 dark:text-orange-400',
    },
    NEW_COMMENT: {
        label: 'Discussion',
        icon: MessageSquare,
        badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
        iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        iconColor: 'text-sky-600 dark:text-sky-400',
    },
    STATUS_UPDATE: {
        label: 'Status Update',
        icon: CheckCircle2,
        badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
        iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    GENERAL: {
        label: 'Civic Alert',
        icon: Bell,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        iconBg: 'bg-muted text-muted-foreground',
        iconColor: 'text-muted-foreground',
    },
};

interface NotificationItemProps {
    notification: NotificationData;
    onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
    onClickNotification: (notification: NotificationData) => void;
    isMarking?: boolean;
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onClickNotification,
    isMarking = false,
}: NotificationItemProps) {
    const category = getNotificationCategory(notification.title, notification.message);
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
        <div
            onClick={() => onClickNotification(notification)}
            className={cn(
                'group relative flex flex-col gap-2 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer text-left',
                notification.read
                    ? 'border-border/50 bg-card/60 hover:bg-accent/40 opacity-80 hover:opacity-100'
                    : 'border-primary/25 bg-primary/[0.03] dark:bg-primary/[0.06] shadow-xs hover:border-primary/40 hover:bg-primary/[0.06]'
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClickNotification(notification);
                }
            }}
        >
            {/* Top row: Category badge, timestamp, unread dot & action button */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={cn('flex size-7 items-center justify-center rounded-lg', config.iconBg)}>
                        <Icon className={cn('size-3.5', config.iconColor)} />
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] font-medium h-5 px-1.5', config.badgeClass)}>
                        {config.label}
                    </Badge>
                    {!notification.read && (
                        <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" title="Unread" />
                    )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-muted-foreground font-mono">
                        {formatRelativeTime(notification.createdAt)}
                    </span>

                    {!notification.read && (
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isMarking}
                            onClick={(e) => onMarkAsRead(notification.id, e)}
                            className="size-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80"
                            title="Mark as read"
                            aria-label="Mark notification as read"
                        >
                            {isMarking ? (
                                <Loader2 className="size-3 animate-spin text-muted-foreground" />
                            ) : (
                                <Check className="size-3 text-muted-foreground group-hover:text-primary" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content row: Title & Message */}
            <div className="space-y-1">
                <h4
                    className={cn(
                        'text-xs font-semibold tracking-tight transition-colors',
                        notification.read ? 'text-foreground/80' : 'text-foreground font-bold'
                    )}
                >
                    {notification.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {notification.message}
                </p>
            </div>

            {/* Bottom link indicator */}
            {notification.link && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-primary/80 group-hover:text-primary pt-0.5 transition-colors">
                    <span>View Pothole Details</span>
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            )}
        </div>
    );
}
