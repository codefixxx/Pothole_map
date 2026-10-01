'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { syncOfflineReports, getOfflineReports } from '@/src/lib/offline-queue';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [offlineCount, setOfflineCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    // Initial check & Service Worker Registration
    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);

        // Register PWA Service Worker
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => {
                    console.log('[PWA] Service Worker registered:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
        }

        // Check offline queued report count
        getOfflineReports().then((reports) => {
            setOfflineCount(reports.length);
        });

        // Online & Offline Event Listeners
        const handleOnline = async () => {
            setIsOnline(true);
            toast.success('Internet connection restored!', {
                icon: <Wifi className="size-4 text-emerald-500" />,
            });

            // Trigger automatic background sync of queued offline reports
            setIsSyncing(true);
            const { syncedCount } = await syncOfflineReports();
            setIsSyncing(false);

            if (syncedCount > 0) {
                toast.success(`Auto-synced ${syncedCount} offline pothole report(s) to municipal queue!`, {
                    icon: <RefreshCw className="size-4 animate-spin text-primary" />,
                });
            }

            const remaining = await getOfflineReports();
            setOfflineCount(remaining.length);
        };

        const handleOffline = async () => {
            setIsOnline(false);
            const reports = await getOfflineReports();
            setOfflineCount(reports.length);
            toast.warning('You are offline. Reports will be saved locally and auto-synced when connection returns.', {
                icon: <WifiOff className="size-4 text-amber-500" />,
                duration: 6000,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            {/* Offline Status Top Bar Banner */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2">
                        <WifiOff className="size-3.5" />
                        <span>Offline Mode Active • Reports will save locally to IndexedDB</span>
                    </div>
                    {offlineCount > 0 && (
                        <span className="bg-amber-950 text-amber-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {offlineCount} report(s) pending sync
                        </span>
                    )}
                </div>
            )}

            {/* Syncing Progress Floating Badge */}
            {isSyncing && (
                <div className="fixed bottom-4 right-4 z-50 bg-background border border-primary/40 shadow-xl rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-foreground animate-bounce">
                    <RefreshCw className="size-4 animate-spin text-primary" />
                    <span>Syncing offline reports to database...</span>
                </div>
            )}

            {children}
        </>
    );
}
