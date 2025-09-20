import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { CategoryModel } from '../database/models/Category.js';
import type { PaginationOptions } from '../database/models/types.js';

const router = Router();

// GET /api/categories - Get all categories with link counts
router.get(
  '/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      limit = '50',
      offset = '0',
      sort_by = 'name',
      sort_order = 'ASC',
      include_counts = 'true',
    } = req.query;

    // Parse and validate pagination parameters
    const parsedLimit = Math.min(
      Math.max(parseInt(limit as string) || 50, 1),
      100
    );
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

    if (include_counts === 'true') {
      // Get categories with link counts
      const categoriesWithCounts =
        await CategoryModel.getCategoriesWithLinkCount();

      // Apply pagination manually since getCategoriesWithLinkCount doesn't support it
      const paginatedCategories = categoriesWithCounts.slice(
        parsedOffset,
        parsedOffset + parsedLimit
      );

      res.json({
        success: true,
        data: paginatedCategories,
        pagination: {
          total: categoriesWithCounts.length,
          limit: parsedLimit,
          offset: parsedOffset,
          has_more: parsedOffset + parsedLimit < categoriesWithCounts.length,
          page: Math.floor(parsedOffset / parsedLimit) + 1,
          total_pages: Math.ceil(categoriesWithCounts.length / parsedLimit),
        },
      });
    } else {
      // Get categories without link counts (faster)
      const options: PaginationOptions = {
        limit: parsedLimit,
        offset: parsedOffset,
        sort_by: sort_by as string,
        sort_order: sort_order as 'ASC' | 'DESC',
      };

      // Validate sort_by parameter
      const validSortFields = ['name', 'created_at', 'updated_at'];
      if (!validSortFields.includes(options.sort_by!)) {
        options.sort_by = 'name';
      }

      // Validate sort_order parameter
      if (!['ASC', 'DESC'].includes(options.sort_order!)) {
        options.sort_order = 'ASC';
      }

      const result = await CategoryModel.findAll(options);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          has_more: result.has_more,
          page: Math.floor(result.offset / result.limit) + 1,
          total_pages: Math.ceil(result.total / result.limit),
        },
      });
    }
  })
);

// GET /api/categories/:id - Get category by ID
router.get(
  '/categories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format',
      });
    }

    const category = await CategoryModel.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  })
);

// GET /api/categories/slug/:slug - Get category by slug
router.get(
  '/categories/slug/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Validate slug format (alphanumeric, hyphens, underscores)
    const slugRegex = /^[a-z0-9-_]+$/i;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category slug format',
      });
    }

    const category = await CategoryModel.findBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  })
);

export { router as categoriesRouter };
