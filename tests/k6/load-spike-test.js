import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Custom Metrics
const healthReqDuration = new Trend('health_req_duration');
const potholesReqDuration = new Trend('potholes_req_duration');
const rateLimitHits = new Counter('rate_limit_hits');
const successRate = new Rate('successful_requests');

export const options = {
    scenarios: {
        traffic_spike_scenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 20 },  // Warm-up to 20 Virtual Users
                { duration: '20s', target: 50 },  // Baseline load at 50 VUs
                { duration: '10s', target: 150 }, // Instant Traffic Spike to 150 VUs
                { duration: '10s', target: 0 },   // Recovery / Ramp-down phase
            ],
            gracefulRampDown: '5s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.05'],                 // Network failure rate must be under 5%
        successful_requests: ['rate>0.40'],             // Clean 200 OK success rate under 150 VU burst
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // 1. Health API Endpoint
    const resHealth = http.get(`${BASE_URL}/api/health`);
    healthReqDuration.add(resHealth.timings.duration);
    
    const isHealthOk = check(resHealth, {
        'Health status 200': (r) => r.status === 200,
        'Health response time < 500ms': (r) => r.timings.duration < 500,
    });
    successRate.add(isHealthOk);

    sleep(0.2);

    // 2. Notifications Endpoint
    const resNotif = http.get(`${BASE_URL}/api/notifications`);
    if (resNotif.status === 429) {
        rateLimitHits.add(1);
    } else {
        check(resNotif, {
            'Notifications status 200': (r) => r.status === 200,
        });
    }

    sleep(0.3);

    // 3. Nearby Potholes Geospatial Query Endpoint
    const lat = 12.9716;
    const lng = 77.5946;
    const resNearby = http.get(`${BASE_URL}/api/potholes/nearby?lat=${lat}&lng=${lng}&radius=10`);
    potholesReqDuration.add(resNearby.timings.duration);

    if (resNearby.status === 429) {
        rateLimitHits.add(1);
    } else {
        const isNearbyOk = check(resNearby, {
            'Potholes status 200': (r) => r.status === 200,
            'Potholes body valid JSON': (r) => {
                try {
                    const json = JSON.parse(r.body);
                    return Array.isArray(json) || (json && typeof json === 'object');
                } catch {
                    return false;
                }
            },
        });
        successRate.add(isNearbyOk);
    }

    sleep(0.5);
}
