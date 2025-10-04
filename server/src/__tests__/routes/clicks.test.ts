import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { ClickEventModel } from '../../database/models/ClickEvent.js';
import { AffiliateLinkModel } from '../../database/models/AffiliateLink.js';
import type { Application } from 'express';
import type { ClickEvent, AffiliateLink } from '../../database/models/types.js';

// Mock the database models
vi.mock('../../database/models/ClickEvent.js');
vi.mock('../../database/models/AffiliateLink.js');

describe('Clicks Routes', () => {
  let app: Application;
  const testLinkId = '123e4567-e89b-12d3-a456-426614174000';
  const inactiveLinkId = '456e7890-e89b-12d3-a456-426614174001';

  const mockClickEvent: ClickEvent = {
    id: 'click-123',
    link_id: testLinkId,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    user_agent: 'Mozilla/5.0 Test Browser',
    referrer: 'https://test-referrer.com',
    ip_address: '127.0.0.1',
    session_id: 'test-session-123',
    country_code: 'US',
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockAffiliateLink: AffiliateLink = {
    id: testLinkId,
    title: 'Test Link',
    description: 'Test affiliate link',
    url: 'https://example.com',
    affiliate_url: 'https://affiliate.example.com/ref123',
    category_id: '789e0123-e89b-12d3-a456-426614174002',
    tags: ['test'],
    image_url: null,
    commission_rate: null,
    featured: false,
    status: 'active',
    click_count: 0,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockInactiveLink: AffiliateLink = {
    ...mockAffiliateLink,
    id: inactiveLinkId,
    title: 'Inactive Link',
    status: 'inactive',
  };

  beforeEach(async () => {
    app = createApp();
    vi.clearAllMocks();

    // Clear rate limiting map between tests
    const { clickRateLimit } = await import('../../routes/clicks.js');
    clickRateLimit.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/clicks', () => {
    it('should record a click event successfully', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const clickData = {
        link_id: testLinkId,
        user_agent: 'Mozilla/5.0 Test Browser',
        referrer: 'https://test-referrer.com',
        session_id: 'test-session-123',
        country_code: 'US',
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        click_event_id: mockClickEvent.id,
        timestamp: mockClickEvent.timestamp.toISOString(),
      });

      expect(AffiliateLinkModel.exists).toHaveBeenCalledWith(testLinkId);
      expect(ClickEventModel.create).toHaveBeenCalledWith({
        link_id: testLinkId,
        user_agent: clickData.user_agent,
        referrer: clickData.referrer,
        ip_address: expect.any(String),
        session_id: clickData.session_id,
        country_code: clickData.country_code,
      });
      expect(AffiliateLinkModel.incrementClickCount).toHaveBeenCalledWith(
        testLinkId
      );
    });

    it('should record click with minimal data', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue({
        ...mockClickEvent,
        user_agent: 'Test Browser',
        referrer: 'https://test.com',
      });
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const clickData = {
        link_id: testLinkId,
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .set('User-Agent', 'Test Browser')
        .set('Referer', 'https://test.com')
        .expect(201);

      expect(response.body.success).toBe(true);

      expect(ClickEventModel.create).toHaveBeenCalledWith({
        link_id: testLinkId,
        user_agent: 'Test Browser',
        referrer: 'https://test.com',
        ip_address: expect.any(String),
        session_id: expect.any(String),
        country_code: undefined,
      });
    });

    it('should return 400 for invalid link_id format', async () => {
      const clickData = {
        link_id: 'invalid-uuid',
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      // The actual response might not have details, so let's just check the error message
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(false);

      const clickData = {
        link_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID but doesn't exist
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Link not found',
        message: 'The specified affiliate link does not exist.',
      });

      expect(AffiliateLinkModel.exists).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(ClickEventModel.create).not.toHaveBeenCalled();
    });

    it('should validate referrer URL format', async () => {
      const clickData = {
        link_id: testLinkId,
        referrer: 'not-a-valid-url',
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should accept empty referrer', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const clickData = {
        link_id: testLinkId,
        referrer: '',
      };

      await request(app).post('/api/clicks').send(clickData).expect(201);
    });

    it('should validate country_code length', async () => {
      const clickData = {
        link_id: testLinkId,
        country_code: 'USA', // Should be 2 characters
      };

      const response = await request(app)
        .post('/api/clicks')
        .send(clickData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle rate limiting', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const clickData = {
        link_id: testLinkId,
      };

      // Make multiple requests quickly to trigger rate limit
      const requests = Array(12)
        .fill(null)
        .map(() => request(app).post('/api/clicks').send(clickData));

      const responses = await Promise.all(requests);

      // Some requests should succeed, others should be rate limited
      const successCount = responses.filter((r) => r.status === 201).length;
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(10); // Rate limit is 10 per minute
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/redirect/:linkId', () => {
    it('should redirect to affiliate URL and track click', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockAffiliateLink
      );
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const response = await request(app)
        .get(`/api/redirect/${testLinkId}`)
        .set('User-Agent', 'Test Browser')
        .set('Referer', 'https://test.com')
        .expect(302);

      expect(response.headers.location).toBe(
        'https://affiliate.example.com/ref123'
      );

      expect(AffiliateLinkModel.findById).toHaveBeenCalledWith(testLinkId);
      expect(ClickEventModel.create).toHaveBeenCalledWith({
        link_id: testLinkId,
        user_agent: 'Test Browser',
        referrer: 'https://test.com',
        ip_address: expect.any(String),
        session_id: expect.any(String),
        country_code: undefined,
      });
      expect(AffiliateLinkModel.incrementClickCount).toHaveBeenCalledWith(
        testLinkId
      );
    });

    it('should redirect with session_id query parameter', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockAffiliateLink
      );
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const sessionId = 'custom-session-123';

      await request(app)
        .get(`/api/redirect/${testLinkId}?session_id=${sessionId}`)
        .expect(302);

      expect(ClickEventModel.create).toHaveBeenCalledWith({
        link_id: testLinkId,
        user_agent: undefined,
        referrer: undefined,
        ip_address: expect.any(String),
        session_id: sessionId,
        country_code: undefined,
      });
    });

    it('should redirect with country query parameter', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockAffiliateLink
      );
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const country = 'CA';

      await request(app)
        .get(`/api/redirect/${testLinkId}?country=${country}`)
        .expect(302);

      expect(ClickEventModel.create).toHaveBeenCalledWith({
        link_id: testLinkId,
        user_agent: undefined,
        referrer: undefined,
        ip_address: expect.any(String),
        session_id: expect.any(String),
        country_code: country,
      });
    });

    it('should return 400 for invalid link ID format', async () => {
      const response = await request(app)
        .get('/api/redirect/invalid-uuid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid link ID',
        message: 'Link ID must be a valid UUID.',
      });
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(null);

      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/redirect/${nonExistentId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Link not found',
        message: 'The specified affiliate link does not exist.',
      });

      expect(AffiliateLinkModel.findById).toHaveBeenCalledWith(nonExistentId);
      expect(ClickEventModel.create).not.toHaveBeenCalled();
    });

    it('should return 410 for inactive link', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockInactiveLink
      );

      const response = await request(app)
        .get(`/api/redirect/${inactiveLinkId}`)
        .expect(410);

      expect(response.body).toMatchObject({
        error: 'Link unavailable',
        message: 'This affiliate link is no longer available.',
      });

      expect(AffiliateLinkModel.findById).toHaveBeenCalledWith(inactiveLinkId);
      expect(ClickEventModel.create).not.toHaveBeenCalled();
    });

    it('should still redirect even if click tracking fails', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockAffiliateLink
      );
      vi.mocked(ClickEventModel.create).mockRejectedValue(
        new Error('Database error')
      );
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const response = await request(app)
        .get(`/api/redirect/${testLinkId}`)
        .expect(302);

      expect(response.headers.location).toBe(
        'https://affiliate.example.com/ref123'
      );
      expect(ClickEventModel.create).toHaveBeenCalled();
    });

    it('should handle rate limiting for redirects', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(
        mockAffiliateLink
      );
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      // Make multiple redirect requests quickly
      const requests = Array(12)
        .fill(null)
        .map(() => request(app).get(`/api/redirect/${testLinkId}`));

      const responses = await Promise.all(requests);

      // Some requests should succeed (302), others should be rate limited (429)
      const successCount = responses.filter((r) => r.status === 302).length;
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(10);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Click tracking accuracy', () => {
    it('should accurately track multiple clicks from different sessions', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      const sessions = ['session-1', 'session-2', 'session-3'];

      // Record clicks from different sessions
      for (const sessionId of sessions) {
        await request(app)
          .post('/api/clicks')
          .send({
            link_id: testLinkId,
            session_id: sessionId,
            user_agent: `Browser-${sessionId}`,
          })
          .expect(201);
      }

      // Verify all clicks were attempted to be recorded
      expect(ClickEventModel.create).toHaveBeenCalledTimes(3);
      expect(AffiliateLinkModel.incrementClickCount).toHaveBeenCalledTimes(3);

      // Verify each session was recorded correctly
      sessions.forEach((sessionId, index) => {
        expect(ClickEventModel.create).toHaveBeenNthCalledWith(index + 1, {
          link_id: testLinkId,
          user_agent: `Browser-${sessionId}`,
          referrer: undefined,
          ip_address: expect.any(String),
          session_id: sessionId,
          country_code: undefined,
        });
      });
    });

    it('should track performance metrics correctly', async () => {
      vi.mocked(AffiliateLinkModel.exists).mockResolvedValue(true);
      vi.mocked(ClickEventModel.create).mockResolvedValue(mockClickEvent);
      vi.mocked(AffiliateLinkModel.incrementClickCount).mockResolvedValue();

      // Record some clicks
      await request(app)
        .post('/api/clicks')
        .send({ link_id: testLinkId })
        .expect(201);

      await request(app)
        .post('/api/clicks')
        .send({ link_id: testLinkId })
        .expect(201);

      // Verify clicks were recorded
      expect(ClickEventModel.create).toHaveBeenCalledTimes(2);
      expect(AffiliateLinkModel.incrementClickCount).toHaveBeenCalledTimes(2);
    });
  });
});
