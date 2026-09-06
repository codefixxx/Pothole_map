'use client';

import React from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import {
    AlertTriangle,
    CheckCircle2,
    ThumbsUp,
    HeartHandshake,
    TrendingUp,
    Shield,
    Award,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface CitizenStatsData {
    reportsFiled: number;
    resolvedIssues: number;
    upvotesGiven: number;
    followedCount: number;
    communityConfirmations: number;
}

interface CitizenStatsProps {
    stats: CitizenStatsData;
    className?: string;
}

export function CitizenStats({ stats, className }: CitizenStatsProps) {
    const resolutionRate =
        stats.reportsFiled > 0
            ? Math.round((stats.resolvedIssues / stats.reportsFiled) * 100)
            : 0;

    const statCards = [
        {
            label: 'Reports Filed',
            value: stats.reportsFiled,
            subtext: `${stats.reportsFiled - stats.resolvedIssues} currently active`,
            icon: AlertTriangle,
            color: 'text-amber-500 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
        },
        {
            label: 'Hazards Repaired',
            value: stats.resolvedIssues,
            subtext: `${resolutionRate}% resolution rate`,
            icon: CheckCircle2,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            badge: stats.resolvedIssues > 0 ? 'Repaired' : undefined,
        },
        {
            label: 'Confirmations Given',
            value: stats.upvotesGiven,
            subtext: 'Boosted community triage',
            icon: ThumbsUp,
            color: 'text-sky-500 dark:text-sky-400',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
        },
        {
            label: 'Community Impact',
            value: stats.communityConfirmations,
            subtext: 'Confirmations on your reports',
            icon: HeartHandshake,
            color: 'text-purple-500 dark:text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            badge: stats.communityConfirmations >= 20 ? 'Civic Champion' : undefined,
        },
    ];

    return (
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
            {statCards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={card.label}
                        className={cn(
                            'relative overflow-hidden border bg-card/60 backdrop-blur-xs transition-all duration-200 hover:shadow-sm',
                            card.border
                        )}
                    >
                        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className={cn('p-2 rounded-lg', card.bg, card.color)}>
                                    <Icon className="size-4" />
                                </div>
                                {card.badge && (
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] font-medium py-0 px-1.5 bg-muted/80"
                                    >
                                        {card.badge}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                                    {card.value}
                                </div>
                                <div className="text-xs font-semibold text-foreground/80">
                                    {card.label}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                    {card.subtext}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
