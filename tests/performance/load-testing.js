import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testCategories = ['web-development', 'design-tools', 'marketing'];
const searchTerms = ['vercel', 'figma', 'email', 'hosting', 'design'];

export default function () {
  // Test 1: Homepage load
  let response = http.get(`${BASE_URL}/api/links`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
    'homepage has links': (r) => JSON.parse(r.body).links.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Category filtering
  const randomCategory = testCategories[Math.floor(Math.random() * testCategories.length)];
  response = http.get(`${BASE_URL}/api/links?category=${randomCategory}`);
  check(response, {
    'category filter status is 200': (r) => r.status === 200,
    'category filter response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Search functionality
  const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  response = http.get(`${BASE_URL}/api/links?search=${randomSearchTerm}`);
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 400ms': (r) => r.timings.duration < 400,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Pagination
  response = http.get(`${BASE_URL}/api/links?page=2&limit=10`);
  check(response, {
    'pagination status is 200': (r) => r.status === 200,
    'pagination response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Categories endpoint
  response = http.get(`${BASE_URL}/api/categories`);
  check(response, {
    'categories status is 200': (r) => r.status === 200,
    'categories response time < 200ms': (r) => r.timings.duration < 200,
    'categories has data': (r) => JSON.parse(r.body).categories.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: Click tracking (simulate)
  const clickData = {
    linkId: '1',
    referrer: 'https://example.com',
    userAgent: 'k6-load-test',
  };
  
  response = http.post(`${BASE_URL}/api/clicks`, JSON.stringify(clickData), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    'click tracking status is 201': (r) => r.status === 201,
    'click tracking response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(2);
}

// Stress test scenario
export function stressTest() {
  const response = http.get(`${BASE_URL}/api/links`);
  check(response, {
    'stress test status is 200': (r) => r.status === 200,
  });
}

// Spike test scenario
export function spikeTest() {
  const response = http.get(`${BASE_URL}/api/links?featured=true`);
  check(response, {
    'spike test status is 200': (r) => r.status === 200,
  });
}

// Volume test scenario
export function volumeTest() {
  // Test with large result sets
  const response = http.get(`${BASE_URL}/api/links?limit=100`);
  check(response, {
    'volume test status is 200': (r) => r.status === 200,
    'volume test has correct limit': (r) => JSON.parse(r.body).links.length <= 100,
  });
}