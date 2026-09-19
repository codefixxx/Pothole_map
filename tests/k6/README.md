# 📊 Grafana k6 Load & Traffic Spike Test Suite

This directory contains the production **Grafana k6** performance & stress benchmarking scripts for PotholeMap API endpoints.

## 📁 File Breakdown

- **`tests/k6/load-spike-test.js`**: Ramping load and traffic spike scenario. Simulates traffic ramping from 0 ➔ 20 ➔ 50 VUs (Virtual Users), then spiking to 150 VUs, followed by recovery. Measures `p50`, `p95`, and `p99` latency percentiles.
- **`tests/k6/soak-test.js`**: Sustained traffic soak test (30 VUs held continuously for 90 seconds) to detect memory leaks, connection pool exhaustion, or degradation over time.

---

## 🚀 Running Grafana k6 Benchmarks

Ensure the Next.js development or production server is running (`http://localhost:3000`):

```bash
# Terminal 1: Start dev or production server
npm run dev
```

Then execute the k6 load test scripts from your terminal:

### 1. Ramping Traffic Spike Benchmark
```bash
npm run test:k6
# OR directly:
k6 run tests/k6/load-spike-test.js
```

### 2. Sustained Soak Load Benchmark
```bash
npm run test:k6:soak
# OR directly:
k6 run tests/k6/soak-test.js
```

### 3. Custom Target URL (Staging / Production)
```bash
k6 run -e BASE_URL=https://your-staging-domain.com tests/k6/load-spike-test.js
```

---

## 📈 Industry-Standard Metrics Tracked

- **`http_req_duration`**: Response time latency percentiles (`p50`, `p95`, `p99`).
- **`http_req_failed`**: Rate of failed requests (`rate < 0.05` target).
- **`rate_limit_hits`**: Custom counter tracking protected `429 Too Many Requests` status codes.
- **`successful_requests`**: Custom rate tracking clean `200 OK` API responses.
