import { EventEmitter } from 'events';

export type RealtimeEventType =
    | 'POTHOLE_CREATED'
    | 'STATUS_UPDATED'
    | 'ASSIGNMENT_UPDATED'
    | 'COMMENT_ADDED'
    | 'VOTE_UPDATED';

export interface RealtimeEventPayload {
    type: RealtimeEventType;
    data: Record<string, any>;
    timestamp: string;
}

declare global {
    var realtimeBroadcaster: EventEmitter | undefined;
}

export const getRealtimeBroadcaster = (): EventEmitter => {
    if (!global.realtimeBroadcaster) {
        const emitter = new EventEmitter();
        // Allow unlimited listeners for SSE clients
        emitter.setMaxListeners(0);
        global.realtimeBroadcaster = emitter;
    }
    return global.realtimeBroadcaster;
};

export function broadcastRealtimeEvent(type: RealtimeEventType, data: Record<string, any>) {
    const emitter = getRealtimeBroadcaster();
    const payload: RealtimeEventPayload = {
        type,
        data,
        timestamp: new Date().toISOString(),
    };
    emitter.emit('event', payload);
    return payload;
}
