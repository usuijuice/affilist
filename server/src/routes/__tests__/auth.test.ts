import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { DatabaseConnection } from '../../database/connection.js';
import { AdminUserModel } from '../../database/models/AdminUser.js';
import bcrypt from 'bcrypt';

const app = createApp();

describe('Auth Routes', () => {
  const db = DatabaseConnection.getInstance();

  beforeEach(async () => {
    // Clear admin_users table
    await db.query('DELETE FROM admin_users');

    // Create a test admin user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    await AdminUserModel.create({
      email: 'admin@test.com',
      name: 'Test Admin',
      password_hash: hashedPassword,
      role: 'admin',
    });
  });

  afterEach(async () => {
    // Clear admin_users table
    await db.query('DELETE FROM admin_users');
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'testpassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@test.com');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'wrong@test.com',
        password: 'testpassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'testpassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should require password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'testpassword123',
      });

      authToken = loginResponse.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@test.com');
    });

    it('should reject missing token', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'testpassword123',
      });

      authToken = loginResponse.body.data.token;
    });

    it('should refresh valid token', async () => {
      // Wait a moment to ensure different timestamp in JWT
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.token).not.toBe(authToken); // Should be a new token
    });

    it('should reject missing token', async () => {
      const response = await request(app).post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'testpassword123',
      });

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'testpassword123',
      });

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@test.com');
      expect(response.body.data.user.name).toBe('Test Admin');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });
});
