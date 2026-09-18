'use client';

import { useEffect } from 'react';

export type RealtimeEventType =
    | 'CONNECTED'
    | 'POTHOLE_CREATED'
    | 'STATUS_UPDATED'
    | 'ASSIGNMENT_UPDATED'
    | 'COMMENT_ADDED'
    | 'VOTE_UPDATED';

export interface RealtimeEvent {
    type: RealtimeEventType;
    data?: Record<string, any>;
    timestamp: string;
}

export function useRealtimeStream(onEvent: (event: RealtimeEvent) => void) {
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let isMounted = true;

        const connect = () => {
            if (!isMounted) return;

            eventSource = new EventSource('/api/realtime/stream');

            eventSource.onmessage = (e) => {
                try {
                    const parsed: RealtimeEvent = JSON.parse(e.data);
                    if (parsed && parsed.type) {
                        onEvent(parsed);
                    }
                } catch (err) {
                    console.error('Failed to parse SSE event payload:', err);
                }
            };

            eventSource.onerror = (err) => {
                // EventSource automatically retries upon connection drops
                console.warn('SSE connection lost, reconnecting...', err);
            };
        };

        connect();

        return () => {
            isMounted = false;
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [onEvent]);
}
