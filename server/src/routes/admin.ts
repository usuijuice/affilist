import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdminOrEditor, requireAdmin } from '../middleware/auth.js';
import { AffiliateLinkModel } from '../database/models/AffiliateLink.js';
import { CategoryModel } from '../database/models/Category.js';
import type { 
  CreateAffiliateLinkInput, 
  UpdateAffiliateLinkInput,
  AffiliateLinkFilters,
  PaginationOptions 
} from '../database/models/types.js';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticateToken);

// Validation middleware for affiliate link creation
const validateCreateLink = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('url')
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('affiliate_url')
    .isURL()
    .withMessage('Affiliate URL must be a valid URL'),
  body('category_id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('commission_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0 and 100'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
];

// Validation middleware for affiliate link updates
const validateUpdateLink = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('affiliate_url')
    .optional()
    .isURL()
    .withMessage('Affiliate URL must be a valid URL'),
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('commission_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0 and 100'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return true;
  }
  return false;
};

// GET /api/admin/links - Get all affiliate links (including inactive) with admin filters
router.get('/links', requireAdminOrEditor, asyncHandler(async (req: Request, res: Response) => {
  const {
    category_id,
    status,
    featured,
    search,
    tags,
    limit = '20',
    offset = '0',
    sort_by = 'created_at',
    sort_order = 'DESC'
  } = req.query;

  // Parse and validate pagination parameters
  const parsedLimit = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);
  const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);
  
  // Build filters (admin can see all statuses)
  const filters: AffiliateLinkFilters = {};

  if (category_id) {
    filters.category_id = category_id as string;
  }

  if (status) {
    filters.status = status as 'active' | 'inactive' | 'pending';
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
    sort_order: sort_order as 'ASC' | 'DESC'
  };

  // Validate sort_by parameter
  const validSortFields = ['created_at', 'updated_at', 'title', 'click_count', 'commission_rate', 'status'];
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
      total_pages: Math.ceil(result.total / result.limit)
    }
  });
}));

// POST /api/admin/links - Create new affiliate link
router.post('/links', requireAdminOrEditor, validateCreateLink, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const {
    title,
    description,
    url,
    affiliate_url,
    category_id,
    tags,
    image_url,
    commission_rate,
    featured,
    status
  } = req.body;

  // Verify category exists
  const categoryExists = await CategoryModel.exists('id', category_id);
  if (!categoryExists) {
    res.status(400).json({
      success: false,
      error: 'Category not found'
    });
    return;
  }

  const linkData: CreateAffiliateLinkInput = {
    title,
    description,
    url,
    affiliate_url,
    category_id,
    tags: tags || [],
    image_url,
    commission_rate,
    featured: featured || false,
    status: status || 'active'
  };

  const newLink = await AffiliateLinkModel.create(linkData);

  res.status(201).json({
    success: true,
    data: newLink,
    message: 'Affiliate link created successfully'
  });
}));

// GET /api/admin/links/:id - Get specific affiliate link (admin view)
router.get('/links/:id', requireAdminOrEditor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid link ID format'
    });
    return;
  }

  const link = await AffiliateLinkModel.findWithCategory(id);

  if (!link) {
    res.status(404).json({
      success: false,
      error: 'Affiliate link not found'
    });
    return;
  }

  res.json({
    success: true,
    data: link
  });
}));

// PUT /api/admin/links/:id - Update affiliate link
router.put('/links/:id', requireAdminOrEditor, validateUpdateLink, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid link ID format'
    });
    return;
  }

  // Check if link exists
  const existingLink = await AffiliateLinkModel.findById(id);
  if (!existingLink) {
    res.status(404).json({
      success: false,
      error: 'Affiliate link not found'
    });
    return;
  }

  const {
    title,
    description,
    url,
    affiliate_url,
    category_id,
    tags,
    image_url,
    commission_rate,
    featured,
    status
  } = req.body;

  // Verify category exists if category_id is being updated
  if (category_id) {
    const categoryExists = await CategoryModel.exists('id', category_id);
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }
  }

  const updateData: UpdateAffiliateLinkInput = {};
  
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (url !== undefined) updateData.url = url;
  if (affiliate_url !== undefined) updateData.affiliate_url = affiliate_url;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (tags !== undefined) updateData.tags = tags;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
  if (featured !== undefined) updateData.featured = featured;
  if (status !== undefined) updateData.status = status;

  const updatedLink = await AffiliateLinkModel.update(id, updateData);

  res.json({
    success: true,
    data: updatedLink,
    message: 'Affiliate link updated successfully'
  });
}));

// DELETE /api/admin/links/:id - Delete affiliate link
router.delete('/links/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid link ID format'
    });
    return;
  }

  // Check if link exists
  const existingLink = await AffiliateLinkModel.findById(id);
  if (!existingLink) {
    res.status(404).json({
      success: false,
      error: 'Affiliate link not found'
    });
    return;
  }

  const deleted = await AffiliateLinkModel.delete(id);

  if (!deleted) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete affiliate link'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Affiliate link deleted successfully'
  });
}));

// POST /api/admin/links/bulk-delete - Bulk delete affiliate links
router.post('/links/bulk-delete', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({
      success: false,
      error: 'IDs array is required and must not be empty'
    });
    return;
  }

  // Validate all IDs are UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const invalidIds = ids.filter(id => !uuidRegex.test(id));
  
  if (invalidIds.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      details: { invalidIds }
    });
    return;
  }

  // Limit bulk operations to prevent abuse
  if (ids.length > 100) {
    res.status(400).json({
      success: false,
      error: 'Cannot delete more than 100 items at once'
    });
    return;
  }

  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Delete each link individually to ensure proper error handling
  for (const id of ids) {
    try {
      const deleted = await AffiliateLinkModel.delete(id);
      if (deleted) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push(`Link ${id} not found`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to delete link ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  res.json({
    success: true,
    data: results,
    message: `Bulk delete completed: ${results.deleted} deleted, ${results.failed} failed`
  });
}));

// PATCH /api/admin/links/bulk-update - Bulk update affiliate links
router.patch('/links/bulk-update', requireAdminOrEditor, asyncHandler(async (req: Request, res: Response) => {
  const { ids, updates } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({
      success: false,
      error: 'IDs array is required and must not be empty'
    });
    return;
  }

  if (!updates || typeof updates !== 'object') {
    res.status(400).json({
      success: false,
      error: 'Updates object is required'
    });
    return;
  }

  // Validate all IDs are UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const invalidIds = ids.filter(id => !uuidRegex.test(id));
  
  if (invalidIds.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      details: { invalidIds }
    });
    return;
  }

  // Limit bulk operations to prevent abuse
  if (ids.length > 100) {
    res.status(400).json({
      success: false,
      error: 'Cannot update more than 100 items at once'
    });
    return;
  }

  // Validate updates object
  const allowedFields = ['status', 'featured', 'category_id'];
  const updateFields = Object.keys(updates);
  const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
  
  if (invalidFields.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid update fields',
      details: { invalidFields, allowedFields }
    });
    return;
  }

  // Validate category_id if provided
  if (updates.category_id) {
    const categoryExists = await CategoryModel.exists('id', updates.category_id);
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }
  }

  const results = {
    updated: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Update each link individually
  for (const id of ids) {
    try {
      const updatedLink = await AffiliateLinkModel.update(id, updates);
      if (updatedLink) {
        results.updated++;
      } else {
        results.failed++;
        results.errors.push(`Link ${id} not found`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to update link ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  res.json({
    success: true,
    data: results,
    message: `Bulk update completed: ${results.updated} updated, ${results.failed} failed`
  });
}));

export { router as adminRouter };