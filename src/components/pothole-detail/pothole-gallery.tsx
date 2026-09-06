'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Maximize2, Sparkles, AlertCircle, Split, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface PotholeGalleryProps {
    imageUrl?: string | null;
    fixedImageUrl?: string | null;
    title?: string;
    isFixed?: boolean;
    className?: string;
}

export function PotholeGallery({
    imageUrl,
    fixedImageUrl,
    title = 'Hazard Report Photo',
    isFixed = false,
    className,
}: PotholeGalleryProps) {
    const [viewMode, setViewMode] = useState<'before' | 'after' | 'split'>('before');
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

    const hasBoth = Boolean(imageUrl && fixedImageUrl);

    const openZoom = (url: string) => {
        setActiveZoomImage(url);
        setIsZoomOpen(true);
    };

    if (!imageUrl && !fixedImageUrl) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 p-8 text-center text-muted-foreground min-h-[260px]',
                    className
                )}
            >
                <AlertCircle className="size-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">No hazard photo available</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                    This report was submitted without an attached image.
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-3', className)}>
            {/* Gallery Control Bar (When both Before & After images exist) */}
            {hasBoth && (
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-1 border border-border/60">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant={viewMode === 'before' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('before')}
                            className="h-7 text-xs gap-1 px-2.5 rounded-md"
                        >
                            <span>Before Repair</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={viewMode === 'after' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('after')}
                            className="h-7 text-xs gap-1 px-2.5 rounded-md text-emerald-600 dark:text-emerald-400 font-medium"
                        >
                            <Sparkles className="size-3" />
                            <span>After Repair</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={viewMode === 'split' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('split')}
                            className="h-7 text-xs gap-1 px-2.5 rounded-md"
                        >
                            <Split className="size-3" />
                            <span className="hidden sm:inline">Side-by-Side</span>
                            <span className="sm:hidden">Split</span>
                        </Button>
                    </div>

                    <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] hidden sm:flex items-center gap-1"
                    >
                        <CheckCircle2 className="size-3" />
                        Verified Resolution
                    </Badge>
                </div>
            )}

            {/* Display Area */}
            {hasBoth && viewMode === 'split' ? (
                /* Side by side comparison */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Before Image */}
                    <div className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border/70 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl!}
                            alt={`Before - ${title}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                        />
                        <div className="absolute top-2.5 left-2.5">
                            <Badge variant="secondary" className="bg-zinc-950/75 text-white backdrop-blur-xs text-[10px]">
                                Before (Reported)
                            </Badge>
                        </div>
                        <button
                            type="button"
                            onClick={() => openZoom(imageUrl!)}
                            className="absolute bottom-2.5 right-2.5 rounded-lg bg-zinc-950/70 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Expand image"
                        >
                            <Maximize2 className="size-3.5" />
                        </button>
                    </div>

                    {/* After Image */}
                    <div className="group relative aspect-4/3 overflow-hidden rounded-xl border border-emerald-500/40 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fixedImageUrl!}
                            alt={`After - ${title}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                        />
                        <div className="absolute top-2.5 left-2.5">
                            <Badge className="bg-emerald-600 text-white backdrop-blur-xs text-[10px]">
                                After (Repaired)
                            </Badge>
                        </div>
                        <button
                            type="button"
                            onClick={() => openZoom(fixedImageUrl!)}
                            className="absolute bottom-2.5 right-2.5 rounded-lg bg-zinc-950/70 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Expand image"
                        >
                            <Maximize2 className="size-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Single Hero Image View */
                <div className="group relative aspect-16/10 sm:aspect-16/9 overflow-hidden rounded-xl border border-border/70 bg-muted shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={viewMode === 'after' && fixedImageUrl ? fixedImageUrl : (imageUrl || fixedImageUrl)!}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-101 cursor-zoom-in"
                        onClick={() =>
                            openZoom(viewMode === 'after' && fixedImageUrl ? fixedImageUrl : (imageUrl || fixedImageUrl)!)
                        }
                    />

                    {/* Badges / Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        {hasBoth ? (
                            <Badge
                                className={cn(
                                    'text-[11px] font-semibold backdrop-blur-md shadow-xs',
                                    viewMode === 'after'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-950/75 text-white'
                                )}
                            >
                                {viewMode === 'after' ? 'Repaired State' : 'Original Reported State'}
                            </Badge>
                        ) : isFixed ? (
                            <Badge className="bg-emerald-600 text-white text-[11px] font-semibold backdrop-blur-md">
                                Repaired
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-zinc-950/75 text-white text-[11px] backdrop-blur-md">
                                Field Hazard Photo
                            </Badge>
                        )}
                    </div>

                    {/* Zoom Button */}
                    <button
                        type="button"
                        onClick={() =>
                            openZoom(viewMode === 'after' && fixedImageUrl ? fixedImageUrl : (imageUrl || fixedImageUrl)!)
                        }
                        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-zinc-950/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md opacity-90 transition-all hover:bg-zinc-950 hover:opacity-100 shadow-md"
                    >
                        <Maximize2 className="size-3.5" />
                        <span>Fullscreen</span>
                    </button>
                </div>
            )}

            {/* High-Resolution Zoom Lightbox Modal */}
            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                <DialogContent className="max-w-4xl border-border bg-background/98 p-2 backdrop-blur-2xl sm:p-4">
                    <DialogTitle className="sr-only">High-Resolution View - {title}</DialogTitle>
                    {activeZoomImage && (
                        <div className="relative max-h-[85vh] overflow-hidden rounded-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={activeZoomImage}
                                alt={title}
                                className="h-auto max-h-[80vh] w-full rounded-lg object-contain mx-auto"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
