import { Router } from 'express';
import { healthRouter } from './health.js';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// API routes will be added here
router.get('/api', (req, res) => {
  res.json({
    message: 'Affilist API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      // Additional endpoints will be documented here
    },
  });
});

export { router as apiRoutes };