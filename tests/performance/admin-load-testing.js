import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('admin_errors');

// Admin load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },  // Ramp up to 5 admin users
    { duration: '3m', target: 5 },  // Stay at 5 admin users
    { duration: '1m', target: 10 }, // Ramp up to 10 admin users
    { duration: '3m', target: 10 }, // Stay at 10 admin users
    { duration: '1m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    admin_errors: ['rate<0.05'],       // Custom error rate must be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'testpassword123';

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const loginData = JSON.parse(loginResponse.body);
    return { token: loginData.token };
  }
  
  throw new Error('Failed to authenticate admin user');
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test 1: Admin dashboard - get all links
  let response = http.get(`${BASE_URL}/api/admin/links`, { headers });
  check(response, {
    'admin links status is 200': (r) => r.status === 200,
    'admin links response time < 800ms': (r) => r.timings.duration < 800,
    'admin links has data': (r) => JSON.parse(r.body).links !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Analytics data
  response = http.get(`${BASE_URL}/api/admin/analytics`, { headers });
  check(response, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response time < 1000ms': (r) => r.timings.duration < 1000,
    'analytics has summary': (r) => JSON.parse(r.body).summary !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Create new affiliate link
  const newLink = {
    title: `Load Test Link ${Math.random().toString(36).substr(2, 9)}`,
    description: 'A test link created during load testing',
    url: 'https://example.com',
    affiliateUrl: 'https://example.com?ref=loadtest',
    categoryId: '1',
    tags: ['test', 'load-testing'],
    commissionRate: 25,
    featured: false,
  };

  response = http.post(`${BASE_URL}/api/admin/links`, JSON.stringify(newLink), { headers });
  check(response, {
    'create link status is 201': (r) => r.status === 201,
    'create link response time < 600ms': (r) => r.timings.duration < 600,
    'create link returns id': (r) => JSON.parse(r.body).id !== undefined,
  }) || errorRate.add(1);

  let createdLinkId = '';
  if (response.status === 201) {
    createdLinkId = JSON.parse(response.body).id;
  }

  sleep(1);

  // Test 4: Update the created link (if creation was successful)
  if (createdLinkId) {
    const updateData = {
      title: `Updated Load Test Link ${Math.random().toString(36).substr(2, 9)}`,
      description: 'Updated description during load testing',
      featured: true,
    };

    response = http.put(`${BASE_URL}/api/admin/links/${createdLinkId}`, JSON.stringify(updateData), { headers });
    check(response, {
      'update link status is 200': (r) => r.status === 200,
      'update link response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);

    // Test 5: Delete the created link
    response = http.del(`${BASE_URL}/api/admin/links/${createdLinkId}`, null, { headers });
    check(response, {
      'delete link status is 204': (r) => r.status === 204,
      'delete link response time < 400ms': (r) => r.timings.duration < 400,
    }) || errorRate.add(1);
  }

  sleep(2);

  // Test 6: Bulk operations simulation
  response = http.get(`${BASE_URL}/api/admin/links?limit=50`, { headers });
  check(response, {
    'bulk query status is 200': (r) => r.status === 200,
    'bulk query response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 7: Analytics with date range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  response = http.get(`${BASE_URL}/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`, { headers });
  check(response, {
    'date range analytics status is 200': (r) => r.status === 200,
    'date range analytics response time < 1200ms': (r) => r.timings.duration < 1200,
  }) || errorRate.add(1);

  sleep(2);
}

// Cleanup function
export function teardown(data) {
  // Logout (if endpoint exists)
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };
  
  http.post(`${BASE_URL}/api/auth/logout`, null, { headers });
}