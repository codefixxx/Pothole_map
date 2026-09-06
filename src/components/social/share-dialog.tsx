'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { Badge } from '@/src/components/ui/badge';
import {
    Share2,
    Copy,
    Check,
    Mail,
    Send,
    MessageCircle,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export interface ShareDialogProps {
    pothole: {
        id: string;
        title: string;
        city?: string | null;
        severity?: number | string;
        status?: string;
    };
    size?: 'sm' | 'default';
    variant?: 'outline' | 'secondary' | 'ghost' | 'default';
    className?: string;
    showLabel?: boolean;
}

export function ShareDialog({
    pothole,
    size = 'sm',
    variant = 'outline',
    className,
    showLabel = true,
}: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/potholes/${pothole.id}`
            : `https://potholemap.org/potholes/${pothole.id}`;

    const shareTitle = `Road Hazard Alert: ${pothole.title}`;
    const shareText = `Check out this reported road hazard on PotholeMap in ${pothole.city || 'your area'}: "${pothole.title}". Confirm or follow repair progress:`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Report link copied to clipboard!');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('Failed to copy link to clipboard');
        }
    };

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
            try {
                await (navigator as any).share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch {
                // User cancelled or share failed, open fallback modal
            }
        }
        setOpen(true);
    };

    // Social share links
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size={size}
                    variant={variant}
                    onClick={(e) => {
                        // On supported mobile devices, prefer native share sheet directly
                        if (
                            typeof navigator !== 'undefined' &&
                            typeof (navigator as any).share === 'function' &&
                            window.innerWidth < 768
                        ) {
                            e.preventDefault();
                            handleNativeShare();
                        }
                    }}
                    className={cn('gap-1.5 transition-colors', size === 'sm' && 'h-8 px-3 text-xs', className)}
                    title="Share this report with neighbors or authorities"
                >
                    <Share2 className="size-3.5" />
                    {showLabel && <span className="hidden sm:inline">Share</span>}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Share2 className="size-4 text-primary" />
                        Share Road Hazard Report
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Spread awareness in your community and urge municipal authorities to expedite repairs.
                    </DialogDescription>
                </DialogHeader>

                {/* Hazard Snapshot */}
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">{pothole.title}</span>
                        {pothole.severity && (
                            <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                                Sev {pothole.severity}/10
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <span>{pothole.city || 'Local Road Network'}</span>
                        <span>•</span>
                        <span className="font-mono">#{pothole.id.slice(-6).toUpperCase()}</span>
                    </div>
                </div>

                {/* Direct Link Copy */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Direct Link</label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={shareUrl}
                            className="h-9 text-xs font-mono bg-muted/40 selection:bg-primary/20"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleCopy}
                            className="h-9 px-3 shrink-0 gap-1.5 text-xs font-medium"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-3.5 text-emerald-300" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Social Share Buttons */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Share via Channels</label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 h-9 text-xs border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
                        >
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>WhatsApp</span>
                            </a>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 h-9 text-xs border-sky-500/20 hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-400"
                        >
                            <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                                <Send className="size-4 text-sky-600 dark:text-sky-400" />
                                <span>X / Twitter</span>
                            </a>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 h-9 text-xs hover:bg-primary/5"
                        >
                            <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4 text-primary" />
                                <span>Telegram</span>
                            </a>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 h-9 text-xs hover:bg-primary/5"
                        >
                            <a href={emailUrl}>
                                <Mail className="size-4 text-muted-foreground" />
                                <span>Email Alert</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
