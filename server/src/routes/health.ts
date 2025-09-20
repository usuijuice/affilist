import { Router } from 'express';
import type { Request, Response } from 'express';
import { config } from '../config/environment.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/connection.js';

const router = Router();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
  };
  
  res.status(200).json(healthCheck);
}));

// Readiness check endpoint
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const services: Record<string, string> = {
    server: 'healthy',
  };

  // Check database connectivity
  try {
    const isDbConnected = await db.testConnection();
    services.database = isDbConnected ? 'healthy' : 'unhealthy';
  } catch (error) {
    services.database = 'unhealthy';
  }

  const allHealthy = Object.values(services).every(status => status === 'healthy');
  const readinessCheck = {
    status: allHealthy ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    services,
  };
  
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(readinessCheck);
}));

export { router as healthRouter };