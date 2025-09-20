import { Router } from 'express';
import { healthRouter } from './health.js';
import { linksRouter } from './links.js';
import { categoriesRouter } from './categories.js';
import { adminRouter } from './admin.js';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Mount API routes
router.use('/api', linksRouter);
router.use('/api', categoriesRouter);
router.use('/api/admin', adminRouter);

// API root endpoint
router.get('/api', (req, res) => {
  res.json({
    message: 'Affilist API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      links: '/api/links',
      categories: '/api/categories',
      featured: '/api/links/featured',
      popular: '/api/links/popular',
      admin: '/api/admin',
    },
  });
});

export { router as apiRoutes };