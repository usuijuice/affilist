import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { AffiliateLinkModel } from '../../database/models/AffiliateLink.js';
import { CategoryModel } from '../../database/models/Category.js';
import { AdminUserModel } from '../../database/models/AdminUser.js';
import { config } from '../../config/environment.js';
import type { Express } from 'express';
import type { AffiliateLink, AdminUser, Category, PaginatedResult } from '../../database/models/types.js';

// Mock the database models
vi.mock('../../database/models/AffiliateLink.js');
vi.mock('../../database/models/Category.js');
vi.mock('../../database/models/AdminUser.js');

describe('Admin API Routes', () => {
  let app: Express;
  let adminToken: string;
  let editorToken: string;

  const mockAdminUser: Omit<AdminUser, 'password_hash'> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    last_login: new Date('2024-01-01T00:00:00Z'),
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockEditorUser: Omit<AdminUser, 'password_hash'> = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    email: 'editor@example.com',
    name: 'Editor User',
    role: 'editor',
    last_login: new Date('2024-01-01T00:00:00Z'),
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockAffiliateLink: AffiliateLink = {
    id: '789e0123-e89b-12d3-a456-426614174002',
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

  const mockCategory: Category = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Test Category',
    slug: 'test-category',
    description: 'A test category description',
    color: '#3B82F6',
    icon: 'test-icon',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();

    // Generate test tokens
    adminToken = jwt.sign(
      { userId: mockAdminUser.id, email: mockAdminUser.email, role: mockAdminUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    editorToken = jwt.sign(
      { userId: mockEditorUser.id, email: mockEditorUser.email, role: mockEditorUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Mock AdminUserModel.findById for authentication
    vi.mocked(AdminUserModel.findById).mockImplementation(async (id: string) => {
      if (id === mockAdminUser.id) return mockAdminUser;
      if (id === mockEditorUser.id) return mockEditorUser;
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/admin/links')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required'
      });
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/links')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: mockAdminUser.id, email: mockAdminUser.email, role: mockAdminUser.role },
        config.jwt.secret,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/admin/links')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringMatching(/Token expired|Invalid token/)
      });
    });

    it('should reject requests for non-existent user', async () => {
      const nonExistentToken = jwt.sign(
        { userId: 'non-existent-id', email: 'nonexistent@example.com', role: 'admin' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/links')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token - user not found'
      });
    });
  });

  describe('GET /api/admin/links', () => {
    it('should return paginated affiliate links for admin', async () => {
      const mockPaginatedResult: PaginatedResult<AffiliateLink> = {
        data: [mockAffiliateLink],
        total: 1,
        limit: 20,
        offset: 0,
        has_more: false,
      };

      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      const response = await request(app)
        .get('/api/admin/links')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockAffiliateLink.id,
            title: mockAffiliateLink.title,
            status: mockAffiliateLink.status,
          })
        ]),
        pagination: expect.any(Object)
      });
    });

    it('should allow editor to access links', async () => {
      const mockPaginatedResult: PaginatedResult<AffiliateLink> = {
        data: [mockAffiliateLink],
        total: 1,
        limit: 20,
        offset: 0,
        has_more: false,
      };

      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/admin/links')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);
    });

    it('should handle filtering and pagination', async () => {
      const mockPaginatedResult: PaginatedResult<AffiliateLink> = {
        data: [mockAffiliateLink],
        total: 1,
        limit: 10,
        offset: 0,
        has_more: false,
      };

      vi.mocked(AffiliateLinkModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get('/api/admin/links?status=active&limit=10&sort_by=title')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(AffiliateLinkModel.findAll).toHaveBeenCalledWith(
        { status: 'active' },
        expect.objectContaining({
          limit: 10,
          sort_by: 'title'
        })
      );
    });
  });

  describe('POST /api/admin/links', () => {
    const validLinkData = {
      title: 'New Test Link',
      description: 'A new test link description',
      url: 'https://newexample.com',
      affiliate_url: 'https://affiliate.newexample.com/ref456',
      category_id: mockCategory.id,
      tags: ['new', 'test'],
      commission_rate: 7.5,
      featured: true,
      status: 'active'
    };

    it('should create new affiliate link for admin', async () => {
      vi.mocked(CategoryModel.exists).mockResolvedValue(true);
      vi.mocked(AffiliateLinkModel.create).mockResolvedValue(mockAffiliateLink);

      const response = await request(app)
        .post('/api/admin/links')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validLinkData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockAffiliateLink.id,
          title: mockAffiliateLink.title,
        }),
        message: 'Affiliate link created successfully'
      });

      expect(AffiliateLinkModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validLinkData.title,
          description: validLinkData.description,
          url: validLinkData.url,
          affiliate_url: validLinkData.affiliate_url,
          category_id: validLinkData.category_id,
        })
      );
    });

    it('should allow editor to create links', async () => {
      vi.mocked(CategoryModel.exists).mockResolvedValue(true);
      vi.mocked(AffiliateLinkModel.create).mockResolvedValue(mockAffiliateLink);

      await request(app)
        .post('/api/admin/links')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(validLinkData)
        .expect(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/links')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });

    it('should validate category exists', async () => {
      vi.mocked(CategoryModel.exists).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/admin/links')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validLinkData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Category not found'
      });
    });

    it('should validate URL formats', async () => {
      const invalidData = {
        ...validLinkData,
        url: 'not-a-url',
        affiliate_url: 'also-not-a-url'
      };

      const response = await request(app)
        .post('/api/admin/links')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed'
      });
    });
  });

  describe('GET /api/admin/links/:id', () => {
    it('should return specific affiliate link', async () => {
      const mockLinkWithCategory = {
        ...mockAffiliateLink,
        category: mockCategory
      };

      vi.mocked(AffiliateLinkModel.findWithCategory).mockResolvedValue(mockLinkWithCategory);

      const response = await request(app)
        .get(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockAffiliateLink.id,
          title: mockAffiliateLink.title,
          category: expect.objectContaining({
            id: mockCategory.id,
            name: mockCategory.name,
          })
        })
      });
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.findWithCategory).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Affiliate link not found'
      });
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/admin/links/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid link ID format'
      });
    });
  });

  describe('PUT /api/admin/links/:id', () => {
    const updateData = {
      title: 'Updated Title',
      status: 'inactive' as const
    };

    it('should update affiliate link', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(mockAffiliateLink);
      vi.mocked(AffiliateLinkModel.update).mockResolvedValue({
        ...mockAffiliateLink,
        ...updateData
      });

      const response = await request(app)
        .put(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockAffiliateLink.id,
          title: updateData.title,
          status: updateData.status,
        }),
        message: 'Affiliate link updated successfully'
      });

      expect(AffiliateLinkModel.update).toHaveBeenCalledWith(
        mockAffiliateLink.id,
        expect.objectContaining(updateData)
      );
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Affiliate link not found'
      });
    });

    it('should validate category if provided', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(mockAffiliateLink);
      vi.mocked(CategoryModel.exists).mockResolvedValue(false);

      const response = await request(app)
        .put(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ category_id: mockCategory.id }) // Use valid UUID format
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Category not found'
      });
    });
  });

  describe('DELETE /api/admin/links/:id', () => {
    it('should delete affiliate link for admin', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(mockAffiliateLink);
      vi.mocked(AffiliateLinkModel.delete).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Affiliate link deleted successfully'
      });

      expect(AffiliateLinkModel.delete).toHaveBeenCalledWith(mockAffiliateLink.id);
    });

    it('should reject delete request from editor', async () => {
      const response = await request(app)
        .delete(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions'
      });
    });

    it('should return 404 for non-existent link', async () => {
      vi.mocked(AffiliateLinkModel.findById).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/admin/links/${mockAffiliateLink.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Affiliate link not found'
      });
    });
  });

  describe('POST /api/admin/links/bulk-delete', () => {
    const linkIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '456e7890-e89b-12d3-a456-426614174001'
    ];

    it('should bulk delete links for admin', async () => {
      vi.mocked(AffiliateLinkModel.delete).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/admin/links/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: linkIds })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          deleted: 2,
          failed: 0,
          errors: []
        }
      });
    });

    it('should reject bulk delete from editor', async () => {
      const response = await request(app)
        .post('/api/admin/links/bulk-delete')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ ids: linkIds })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions'
      });
    });

    it('should validate IDs array', async () => {
      const response = await request(app)
        .post('/api/admin/links/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'IDs array is required and must not be empty'
      });
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .post('/api/admin/links/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['invalid-uuid'] })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid ID format'
      });
    });

    it('should limit bulk operations', async () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => {
        const paddedIndex = i.toString().padStart(3, '0');
        return `123e4567-e89b-12d3-a456-4266141740${paddedIndex.slice(-2)}`;
      });

      const response = await request(app)
        .post('/api/admin/links/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: tooManyIds })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Cannot delete more than 100 items at once'
      });
    });
  });

  describe('PATCH /api/admin/links/bulk-update', () => {
    const linkIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '456e7890-e89b-12d3-a456-426614174001'
    ];

    const updates = {
      status: 'inactive' as const,
      featured: false
    };

    it('should bulk update links', async () => {
      vi.mocked(AffiliateLinkModel.update).mockResolvedValue(mockAffiliateLink);

      const response = await request(app)
        .patch('/api/admin/links/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: linkIds, updates })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          updated: 2,
          failed: 0,
          errors: []
        }
      });
    });

    it('should allow editor to bulk update', async () => {
      vi.mocked(AffiliateLinkModel.update).mockResolvedValue(mockAffiliateLink);

      await request(app)
        .patch('/api/admin/links/bulk-update')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ ids: linkIds, updates })
        .expect(200);
    });

    it('should validate updates object', async () => {
      const response = await request(app)
        .patch('/api/admin/links/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: linkIds, updates: { invalid_field: 'value' } })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid update fields'
      });
    });

    it('should validate category if provided in updates', async () => {
      vi.mocked(CategoryModel.exists).mockResolvedValue(false);

      const response = await request(app)
        .patch('/api/admin/links/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          ids: linkIds, 
          updates: { category_id: 'non-existent-category' } 
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Category not found'
      });
    });
  });
});