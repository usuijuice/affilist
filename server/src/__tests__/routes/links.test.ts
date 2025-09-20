import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { AffiliateLinkModel } from '../../database/models/AffiliateLink.js';
import type { Express } from 'express';
import type { AffiliateLink, PaginatedResult } from '../../database/models/types.js';

// Mock the database model
vi.mock('../../database/models/AffiliateLink.js');

describe('Links API Routes', () => {
  let app: Express;

  const mockAffiliateLink: AffiliateLink = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Affiliate Link',
    description: 'A test affiliate link description',
    url: 'https://example.com',
    affiliate_url: 'https://affiliate.example.com/ref123',
    category_id: '456e7890-e89b-12d3-a456-426614174001',
    tags: ['test', 'example'],
    image_url: 'https://example.com/image.jpg',
    commission_rate: 5.5,
    featured: true,
    status: 'active',
    click_count: 100,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockAffiliateLinkWithCategory = {
    ...mockAffiliateLink,
    category: {
      id: '456e7890-e89b-12d3-a456-426614174001',
      name: 'Test Category',
      slug: 'test-category',
      color: '#3B82F6',
      icon: 'test-icon'
    }
  };

  const mockPaginatedResult: PaginatedResult<AffiliateLink> = {
    data: [mockAffiliateLink],
    total: 1,
    limit: 20,
    offset: 0,
    has_more: false,
  };

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/links', () => {
    it('should return paginated affiliate links with default parameters', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      const response = await request(app)
        .get('/api/links')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockAffiliateLink.id,
            title: mockAffiliateLink.title,
            description: mockAffiliateLink.description,
            url: mockAffiliateLink.url,
            affiliate_url: mockAffiliateLink.affiliate_url,
            category_id: mockAffiliateLink.category_id,
            tags: mockAffiliateLink.tags,
            image_url: mockAffiliateLink.image_url,
            commission_rate: mockAffiliateLink.commission_rate,
            featured: mockAffiliateLink.featured,
            status: mockAffiliateLink.status,
            click_count: mockAffiliateLink.click_count,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        ]),
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          has_more: false,
          page: 1,
          total_pages: 1,
        },
      });

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        {
          limit: 20,
          offset: 0,
          sort_by: 'created_at',
          sort_order: 'DESC',
        }
      );
    });

    it('should handle custom pagination parameters', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue({
        ...mockPaginatedResult,
        limit: 10,
        offset: 20,
        total: 50,
        has_more: true,
      });

      const response = await request(app)
        .get('/api/links?limit=10&offset=20')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        total: 50,
        limit: 10,
        offset: 20,
        has_more: true,
        page: 3,
        total_pages: 5,
      });

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        {
          limit: 10,
          offset: 20,
          sort_by: 'created_at',
          sort_order: 'DESC',
        }
      );
    });

    it('should handle filtering by category', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?category_id=456e7890-e89b-12d3-a456-426614174001')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        {
          status: 'active',
          category_id: '456e7890-e89b-12d3-a456-426614174001',
        },
        expect.any(Object)
      );
    });

    it('should handle search filtering', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?search=test%20query')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        {
          status: 'active',
          search: 'test query',
        },
        expect.any(Object)
      );
    });

    it('should handle featured filtering', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?featured=true')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        {
          status: 'active',
          featured: true,
        },
        expect.any(Object)
      );
    });

    it('should handle tag filtering', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?tags=tag1&tags=tag2')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        {
          status: 'active',
          tags: ['tag1', 'tag2'],
        },
        expect.any(Object)
      );
    });

    it('should handle custom sorting', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?sort_by=click_count&sort_order=ASC')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        {
          limit: 20,
          offset: 0,
          sort_by: 'click_count',
          sort_order: 'ASC',
        }
      );
    });

    it('should validate and limit pagination parameters', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?limit=200&offset=-10')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        {
          limit: 100, // Should be capped at 100
          offset: 0,  // Should be minimum 0
          sort_by: 'created_at',
          sort_order: 'DESC',
        }
      );
    });

    it('should validate sort parameters', async () => {
      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/links?sort_by=invalid_field&sort_order=INVALID')
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        {
          limit: 20,
          offset: 0,
          sort_by: 'created_at', // Should default to created_at
          sort_order: 'DESC',     // Should default to DESC
        }
      );
    });
  });

  describe('GET /api/links/:id', () => {
    it('should return affiliate link with category', async () => {
      vi.mocked(AffiliateLinkModel.findWithCategory).mockResolvedValue(mockAffiliateLinkWithCategory);

      const response = await request(app)
        .get('/api/links/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockAffiliateLinkWithCategory.id,
          title: mockAffiliateLinkWithCategory.title,
          description: mockAffiliateLinkWithCategory.description,
          url: mockAffiliateLinkWithCategory.url,
          affiliate_url: mockAffiliateLinkWithCategory.affiliate_url,
          category_id: mockAffiliateLinkWithCategory.category_id,
          tags: mockAffiliateLinkWithCategory.tags,
          image_url: mockAffiliateLinkWithCategory.image_url,
          commission_rate: mockAffiliateLinkWithCategory.commission_rate,
          featured: mockAffiliateLinkWithCategory.featured,
          status: mockAffiliateLinkWithCategory.status,
          click_count: mockAffiliateLinkWithCategory.click_count,
          created_at: expect.any(String),
          updated_at: expect.any(String),
          category: mockAffiliateLinkWithCategory.category,
        }),
      });

      expect(AffiliateLinkModel.findWithCategory).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.findWithCategory).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/links/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Affiliate link not found',
      });
    });

    it('should return 404 for inactive link', async () => {
      vi.mocked(AffiliateLinkModel.findWithCategory).mockResolvedValue({
        ...mockAffiliateLinkWithCategory,
        status: 'inactive',
      });

      const response = await request(app)
        .get('/api/links/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Affiliate link not found',
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/links/invalid-uuid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid link ID format',
      });

      expect(AffiliateLinkModel.findWithCategory).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/links/featured', () => {
    it('should return featured links with default limit', async () => {
      const featuredLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getFeatured).mockResolvedValue(featuredLinks);

      const response = await request(app)
        .get('/api/links/featured')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockAffiliateLink.id,
            title: mockAffiliateLink.title,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        ]),
        count: 1,
      });

      expect(AffiliateLinkModel.getFeatured).toHaveBeenCalledWith(10);
    });

    it('should handle custom limit', async () => {
      const featuredLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getFeatured).mockResolvedValue(featuredLinks);

      await request(app)
        .get('/api/links/featured?limit=5')
        .expect(200);

      expect(AffiliateLinkModel.getFeatured).toHaveBeenCalledWith(5);
    });

    it('should limit maximum featured links', async () => {
      const featuredLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getFeatured).mockResolvedValue(featuredLinks);

      await request(app)
        .get('/api/links/featured?limit=100')
        .expect(200);

      expect(AffiliateLinkModel.getFeatured).toHaveBeenCalledWith(50); // Should be capped at 50
    });
  });

  describe('GET /api/links/popular', () => {
    it('should return popular links with default limit', async () => {
      const popularLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getPopular).mockResolvedValue(popularLinks);

      const response = await request(app)
        .get('/api/links/popular')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockAffiliateLink.id,
            title: mockAffiliateLink.title,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        ]),
        count: 1,
      });

      expect(AffiliateLinkModel.getPopular).toHaveBeenCalledWith(10);
    });

    it('should handle custom limit', async () => {
      const popularLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getPopular).mockResolvedValue(popularLinks);

      await request(app)
        .get('/api/links/popular?limit=20')
        .expect(200);

      expect(AffiliateLinkModel.getPopular).toHaveBeenCalledWith(20);
    });

    it('should limit maximum popular links', async () => {
      const popularLinks = [mockAffiliateLink];
      vi.mocked(AffiliateLinkModel.getPopular).mockResolvedValue(popularLinks);

      await request(app)
        .get('/api/links/popular?limit=100')
        .expect(200);

      expect(AffiliateLinkModel.getPopular).toHaveBeenCalledWith(50); // Should be capped at 50
    });
  });
});