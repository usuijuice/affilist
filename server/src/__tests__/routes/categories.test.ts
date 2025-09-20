import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { CategoryModel } from '../../database/models/Category.js';
import type { Application } from 'express';
import type { Category, PaginatedResult } from '../../database/models/types.js';

// Mock the database model
vi.mock('../../database/models/Category.js');

describe('Categories API Routes', () => {
  let app: Application;

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

  const mockCategoryWithCount = {
    ...mockCategory,
    link_count: 5,
  };

  const mockPaginatedResult: PaginatedResult<Category> = {
    data: [mockCategory],
    total: 1,
    limit: 50,
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

  describe('GET /api/categories', () => {
    it('should return categories with link counts by default', async () => {
      vi.mocked(CategoryModel.getCategoriesWithLinkCount).mockResolvedValue([
        mockCategoryWithCount,
      ]);

      const response = await request(app).get('/api/categories').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockCategoryWithCount.id,
            name: mockCategoryWithCount.name,
            slug: mockCategoryWithCount.slug,
            description: mockCategoryWithCount.description,
            color: mockCategoryWithCount.color,
            icon: mockCategoryWithCount.icon,
            link_count: mockCategoryWithCount.link_count,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }),
        ]),
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          has_more: false,
          page: 1,
          total_pages: 1,
        },
      });

      expect(CategoryModel.getCategoriesWithLinkCount).toHaveBeenCalled();
      expect(CategoryModel.findAll).not.toHaveBeenCalled();
    });

    it('should return categories without link counts when requested', async () => {
      vi.mocked(CategoryModel.findAll).mockResolvedValue(mockPaginatedResult);

      const response = await request(app)
        .get('/api/categories?include_counts=false')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockCategory.id,
            name: mockCategory.name,
            slug: mockCategory.slug,
            description: mockCategory.description,
            color: mockCategory.color,
            icon: mockCategory.icon,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }),
        ]),
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          has_more: false,
          page: 1,
          total_pages: 1,
        },
      });

      expect(CategoryModel.findAll).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        sort_by: 'name',
        sort_order: 'ASC',
      });
      expect(CategoryModel.getCategoriesWithLinkCount).not.toHaveBeenCalled();
    });

    it('should handle custom pagination parameters with link counts', async () => {
      const categories = Array.from({ length: 100 }, (_, i) => ({
        ...mockCategoryWithCount,
        id: `category-${i}`,
        name: `Category ${i}`,
      }));
      vi.mocked(CategoryModel.getCategoriesWithLinkCount).mockResolvedValue(
        categories
      );

      const response = await request(app)
        .get('/api/categories?limit=10&offset=20')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        total: 100,
        limit: 10,
        offset: 20,
        has_more: true,
        page: 3,
        total_pages: 10,
      });

      expect(response.body.data).toHaveLength(10);
      expect(response.body.data[0].name).toBe('Category 20');
    });

    it('should handle custom pagination parameters without link counts', async () => {
      vi.mocked(CategoryModel.findAll).mockResolvedValue({
        ...mockPaginatedResult,
        limit: 10,
        offset: 20,
        total: 100,
        has_more: true,
      });

      const response = await request(app)
        .get('/api/categories?include_counts=false&limit=10&offset=20')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        total: 100,
        limit: 10,
        offset: 20,
        has_more: true,
        page: 3,
        total_pages: 10,
      });

      expect(CategoryModel.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
        sort_by: 'name',
        sort_order: 'ASC',
      });
    });

    it('should handle custom sorting without link counts', async () => {
      vi.mocked(CategoryModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get(
          '/api/categories?include_counts=false&sort_by=created_at&sort_order=DESC'
        )
        .expect(200);

      expect(CategoryModel.findAll).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'DESC',
      });
    });

    it('should validate and limit pagination parameters', async () => {
      vi.mocked(CategoryModel.getCategoriesWithLinkCount).mockResolvedValue([
        mockCategoryWithCount,
      ]);

      await request(app)
        .get('/api/categories?limit=200&offset=-10')
        .expect(200);

      // For link counts, pagination is applied manually, so we check the response
      const response = await request(app)
        .get('/api/categories?limit=200&offset=-10')
        .expect(200);

      expect(response.body.pagination.limit).toBe(100); // Should be capped at 100
      expect(response.body.pagination.offset).toBe(0); // Should be minimum 0
    });

    it('should validate sort parameters without link counts', async () => {
      vi.mocked(CategoryModel.findAll).mockResolvedValue(mockPaginatedResult);

      await request(app)
        .get(
          '/api/categories?include_counts=false&sort_by=invalid_field&sort_order=INVALID'
        )
        .expect(200);

      expect(CategoryModel.findAll).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        sort_by: 'name', // Should default to name
        sort_order: 'ASC', // Should default to ASC
      });
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return category by ID', async () => {
      vi.mocked(CategoryModel.findById).mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/categories/456e7890-e89b-12d3-a456-426614174001')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockCategory.id,
          name: mockCategory.name,
          slug: mockCategory.slug,
          description: mockCategory.description,
          color: mockCategory.color,
          icon: mockCategory.icon,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      });

      expect(CategoryModel.findById).toHaveBeenCalledWith(
        '456e7890-e89b-12d3-a456-426614174001'
      );
    });

    it('should return 404 for non-existent category', async () => {
      vi.mocked(CategoryModel.findById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/categories/456e7890-e89b-12d3-a456-426614174001')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Category not found',
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/categories/invalid-uuid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid category ID format',
      });

      expect(CategoryModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      vi.mocked(CategoryModel.findBySlug).mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/categories/slug/test-category')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockCategory.id,
          name: mockCategory.name,
          slug: mockCategory.slug,
          description: mockCategory.description,
          color: mockCategory.color,
          icon: mockCategory.icon,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      });

      expect(CategoryModel.findBySlug).toHaveBeenCalledWith('test-category');
    });

    it('should return 404 for non-existent category slug', async () => {
      vi.mocked(CategoryModel.findBySlug).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/categories/slug/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Category not found',
      });
    });

    it('should return 400 for invalid slug format', async () => {
      const response = await request(app)
        .get('/api/categories/slug/invalid@slug!')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid category slug format',
      });

      expect(CategoryModel.findBySlug).not.toHaveBeenCalled();
    });

    it('should accept valid slug formats', async () => {
      vi.mocked(CategoryModel.findBySlug).mockResolvedValue(mockCategory);

      // Test various valid slug formats
      const validSlugs = [
        'test-category',
        'test_category',
        'TestCategory123',
        'category-123_test',
      ];

      for (const slug of validSlugs) {
        await request(app).get(`/api/categories/slug/${slug}`).expect(200);

        expect(CategoryModel.findBySlug).toHaveBeenCalledWith(slug);
      }
    });
  });
});
