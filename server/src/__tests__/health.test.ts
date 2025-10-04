import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { healthRouter } from '../routes/health.js';

describe('Health Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', healthRouter);
  });

  describe('GET /health', () => {
    it('should return health check information', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        environment: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
      });

      expect(typeof response.body.timestamp).toBe('string');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return consistent structure', async () => {
      const response1 = await request(app).get('/health');
      const response2 = await request(app).get('/health');

      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
      expect(response1.body.status).toBe(response2.body.status);
      expect(response1.body.environment).toBe(response2.body.environment);
    });
  });

  describe('GET /ready', () => {
    it('should return readiness check information', async () => {
      const response = await request(app).get('/ready').expect(200);

      expect(response.body).toMatchObject({
        status: 'READY',
        services: {
          database: 'healthy',
          server: 'healthy',
        },
      });

      expect(typeof response.body.timestamp).toBe('string');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should include all required service checks', async () => {
      const response = await request(app).get('/ready').expect(200);

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('server');
      expect(response.body.services.server).toBe('healthy');
    });
  });
});
