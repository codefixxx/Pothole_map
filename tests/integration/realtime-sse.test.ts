import { broadcastRealtimeEvent, getRealtimeBroadcaster, RealtimeEventPayload } from '../../src/lib/events';
import { getCachedOrFetch, invalidateCacheKeys } from '../../src/lib/cache';

export async function runRealtimeSseIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Realtime SSE Broadcaster & Cache Purge ---');

    let eventReceived = false;
    const emitter = getRealtimeBroadcaster();

    const listener = (payload: RealtimeEventPayload) => {
        if (payload.type === 'STATUS_UPDATED' && payload.data?.potholeId === 'pothole-sse-test-id') {
            eventReceived = true;
        }
    };

    emitter.on('event', listener);

    // 1. Broadcast test status update
    broadcastRealtimeEvent('STATUS_UPDATED', {
        potholeId: 'pothole-sse-test-id',
        oldStatus: 'PENDING',
        newStatus: 'VERIFIED',
    });

    emitter.off('event', listener);

    if (eventReceived) {
        console.log('  ✅ SSE Realtime Event Emission & Listener Dispatch: PASSED');
    } else {
        console.error('❌ SSE Realtime Event Emission: FAILED');
        return false;
    }

    // 2. Cache Hit & Invalidation
    let fetchCount = 0;
    const testFetcher = async () => {
        fetchCount++;
        return [{ id: 'sse-p1', status: 'PENDING' }];
    };

    const c1 = await getCachedOrFetch('test:sse:query', 10, testFetcher);
    const c2 = await getCachedOrFetch('test:sse:query', 10, testFetcher);

    if (fetchCount === 1 && c1.length === 1 && c2.length === 1) {
        console.log('  ✅ Query Response Cache Hit (Memory/Redis): PASSED');
    } else {
        console.error('❌ Query Response Cache Hit: FAILED', fetchCount);
        return false;
    }

    await invalidateCacheKeys(['test:sse:query']);
    const c3 = await getCachedOrFetch('test:sse:query', 10, testFetcher);

    if (fetchCount === 2) {
        console.log('  ✅ Cache Invalidation on Event Trigger: PASSED');
    } else {
        console.error('❌ Cache Invalidation: FAILED', fetchCount);
        return false;
    }

    console.log('✅ Realtime SSE Integration Suite: ALL 3 TESTS PASSED');
    return true;
}
