import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set required environment variables for testing
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
});
