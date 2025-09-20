import { Router } from 'express';
import { healthRouter } from './health.js';
import { linksRouter } from './links.js';
import { categoriesRouter } from './categories.js';
import { adminRouter } from './admin.js';
import { clicksRouter } from './clicks.js';
import { analyticsRouter } from './analytics.js';
import { authRouter } from './auth.js';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Mount API routes
router.use('/api', linksRouter);
router.use('/api', categoriesRouter);
router.use('/api', clicksRouter);
router.use('/api', analyticsRouter);
router.use('/api/auth', authRouter);
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
      clicks: '/api/clicks',
      redirect: '/api/redirect/:linkId',
      auth: '/api/auth',
      analytics: '/api/admin/analytics',
      admin: '/api/admin',
    },
  });
});

export { router as apiRoutes };