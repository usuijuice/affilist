import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AffiliateLinkModel } from '../database/models/AffiliateLink.js';
import type {
  AffiliateLinkFilters,
  PaginationOptions,
} from '../database/models/types.js';

const router = Router();

// GET /api/links/featured - Get featured links (must come before /links/:id)
router.get(
  '/links/featured',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const parsedLimit = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      50
    );

    const featuredLinks = await AffiliateLinkModel.getFeatured(parsedLimit);

    res.json({
      success: true,
      data: featuredLinks,
      count: featuredLinks.length,
    });
  })
);

// GET /api/links/popular - Get popular links (must come before /links/:id)
router.get(
  '/links/popular',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const parsedLimit = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      50
    );

    const popularLinks = await AffiliateLinkModel.getPopular(parsedLimit);

    res.json({
      success: true,
      data: popularLinks,
      count: popularLinks.length,
    });
  })
);

// GET /api/links - Get affiliate links with filtering and pagination
router.get(
  '/links',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category_id,
      status = 'active',
      featured,
      search,
      tags,
      limit = '20',
      offset = '0',
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Parse and validate pagination parameters
    const parsedLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100
    );
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

    // Build filters
    const filters: AffiliateLinkFilters = {
      status: status as 'active' | 'inactive' | 'pending',
    };

    if (category_id) {
      filters.category_id = category_id as string;
    }

    if (featured !== undefined) {
      filters.featured = featured === 'true';
    }

    if (search) {
      filters.search = search as string;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = tagArray as string[];
    }

    // Build pagination options
    const options: PaginationOptions = {
      limit: parsedLimit,
      offset: parsedOffset,
      sort_by: sort_by as string,
      sort_order: sort_order as 'ASC' | 'DESC',
    };

    // Validate sort_by parameter
    const validSortFields = [
      'created_at',
      'updated_at',
      'title',
      'click_count',
      'commission_rate',
    ];
    if (!validSortFields.includes(options.sort_by!)) {
      options.sort_by = 'created_at';
    }

    // Validate sort_order parameter
    if (!['ASC', 'DESC'].includes(options.sort_order!)) {
      options.sort_order = 'DESC';
    }

    const result = await AffiliateLinkModel.findAll(filters, options);

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
  })
);

// GET /api/links/:id - Get individual link details
router.get(
  '/links/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid link ID format',
      });
      return;
    }

    const link = await AffiliateLinkModel.findWithCategory(id);

    if (!link) {
      res.status(404).json({
        success: false,
        error: 'Affiliate link not found',
      });
      return;
    }

    // Only return active links for public API
    if (link.status !== 'active') {
      res.status(404).json({
        success: false,
        error: 'Affiliate link not found',
      });
      return;
    }

    res.json({
      success: true,
      data: link,
    });
  })
);

export { router as linksRouter };
