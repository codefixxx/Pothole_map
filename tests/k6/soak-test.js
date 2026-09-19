import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const soakReqDuration = new Trend('soak_req_duration');
const rateLimitCounter = new Counter('rate_limit_hits');

export const options = {
    scenarios: {
        soak_scenario: {
            executor: 'constant-vus',
            vus: 30,             // Sustained 30 Virtual Users
            duration: '1m30s',   // Sustained load for 1 min 30 sec
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // Query platform endpoints continuously over sustained duration
    const res = http.get(`${BASE_URL}/api/health`);
    soakReqDuration.add(res.timings.duration);

    if (res.status === 429) {
        rateLimitCounter.add(1);
    } else {
        check(res, {
            'Soak check status 200': (r) => r.status === 200,
            'Response time < 800ms': (r) => r.timings.duration < 800,
        });
    }

    sleep(0.5);
}
