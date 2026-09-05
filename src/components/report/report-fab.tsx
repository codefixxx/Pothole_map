'use client';

import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';

interface ReportFABProps {
    onClick: () => void;
    className?: string;
}

export function ReportFAB({ onClick, className = '' }: ReportFABProps) {
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClick}
                        aria-label="Report new pothole or road hazard"
                        className={`group fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-3.5 text-white shadow-xl hover:bg-amber-700 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 sm:px-5 ${className}`}
                    >
                        <span className="relative flex size-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-75"></span>
                            <span className="relative inline-flex size-3 rounded-full bg-white"></span>
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight">
                            <Plus className="size-4 stroke-[3]" />
                            <span className="font-semibold">Report Hazard</span>
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                    Quickly report a pothole at your current location
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
