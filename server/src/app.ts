import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { rateLimiter, securityHeaders, requestLogger } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

export const createApp = (): express.Application => {
  const app = express();
  
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Security middleware
  app.use(securityHeaders);
  app.use(rateLimiter);
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Logging middleware
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }
  app.use(requestLogger);
  
  // API routes
  app.use('/', apiRoutes);
  
  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

export default createApp;