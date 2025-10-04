import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { AdminUserModel } from '../database/models/AdminUser.js';
import { config } from '../config/environment.js';
import type { AdminUser } from '../database/models/types.js';

const router = Router();

// Validation middleware for login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return true;
  }
  return false;
};

// Helper function to generate JWT token
const generateToken = (user: AdminUser): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions;

  return jwt.sign(payload, config.jwt.secret, options);
};

// Helper function to create user response (without sensitive data)
const createUserResponse = (
  user: Omit<AdminUser, 'password_hash'> | AdminUser
) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  lastLogin: user.last_login,
  createdAt: user.created_at,
});

// POST /api/auth/login - Admin login
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Find user by email
    const user = await AdminUserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update last login timestamp
    await AdminUserModel.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: createUserResponse(user),
      },
      message: 'Login successful',
    });
  })
);

// POST /api/auth/logout - Admin logout
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    // In a more sophisticated implementation, you might maintain a blacklist of tokens
    // For now, we'll just return success since JWT tokens are stateless
    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

// GET /api/auth/verify - Verify token and get current user
router.get(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: createUserResponse(req.user),
      },
    });
  })
);

// POST /api/auth/refresh - Refresh JWT token
router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Generate new token
    const token = generateToken(req.user);

    res.json({
      success: true,
      data: {
        token,
        user: createUserResponse(req.user),
      },
      message: 'Token refreshed successfully',
    });
  })
);

// GET /api/auth/profile - Get current user profile
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Get fresh user data from database
    const user = await AdminUserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: createUserResponse(user),
      },
    });
  })
);

export { router as authRouter };
