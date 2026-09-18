import { getRealtimeBroadcaster, RealtimeEventPayload } from '@/src/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const emitter = getRealtimeBroadcaster();

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            const initMessage = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(encoder.encode(initMessage));

            // Listener function for broadcasted events
            const onEvent = (payload: RealtimeEventPayload) => {
                try {
                    const message = `data: ${JSON.stringify(payload)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (err) {
                    console.error('Error sending SSE message:', err);
                }
            };

            emitter.on('event', onEvent);

            // Periodic keep-alive ping every 15 seconds
            const heartbeat = setInterval(() => {
                try {
                    const ping = `: keep-alive\n\n`;
                    controller.enqueue(encoder.encode(ping));
                } catch (err) {
                    clearInterval(heartbeat);
                }
            }, 15000);

            // Cleanup on client disconnect
            request.signal.addEventListener('abort', () => {
                emitter.off('event', onEvent);
                clearInterval(heartbeat);
                try {
                    controller.close();
                } catch (e) {
                    // Already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
