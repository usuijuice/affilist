import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { AdminUserModel } from '../database/models/AdminUser.js';
import type { AdminUser } from '../database/models/types.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AdminUser;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'editor';
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Get user from database to ensure they still exist and are active
    const user = await AdminUserModel.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token - user not found'
      });
      return;
    }

    // Attach user to request (cast to full AdminUser type for auth purposes)
    req.user = user as AdminUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
      return;
    }

    // Other errors
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export const requireRole = (roles: ('admin' | 'editor')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(['admin']);

// Convenience middleware for admin or editor routes
export const requireAdminOrEditor = requireRole(['admin', 'editor']);