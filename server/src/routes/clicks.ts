import { Router, type Request, type Response } from 'express';
import { ClickEventModel } from '../database/models/ClickEvent.js';
import { AffiliateLinkModel } from '../database/models/AffiliateLink.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const createClickEventSchema = z.object({
  link_id: z.string().uuid(),
  user_agent: z.string().optional(),
  referrer: z.string().url().optional().or(z.literal('')),
  session_id: z.string().optional(),
  country_code: z.string().length(2).optional(),
});

// Rate limiting for click tracking (prevent spam)
const clickRateLimit = new Map<string, { count: number; resetTime: number }>();
const CLICK_RATE_LIMIT = 10; // Max 10 clicks per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = clickRateLimit.get(ip);

  if (!record || now > record.resetTime) {
    clickRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= CLICK_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Generate session ID if not provided
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// POST /api/clicks - Record a click event
router.post('/clicks', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    // Validate request body
    const validationResult = createClickEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
      return;
    }

    const { link_id, user_agent, referrer, session_id, country_code } =
      validationResult.data;

    // Verify the affiliate link exists
    const linkExists = await AffiliateLinkModel.exists(link_id);
    if (!linkExists) {
      res.status(404).json({
        error: 'Link not found',
        message: 'The specified affiliate link does not exist.',
      });
      return;
    }

    // Create click event
    const clickEvent = await ClickEventModel.create({
      link_id,
      user_agent: user_agent || req.get('User-Agent'),
      referrer: referrer || req.get('Referer'),
      ip_address: clientIp,
      session_id: session_id || generateSessionId(),
      country_code,
    });

    // Increment click count on the affiliate link
    await AffiliateLinkModel.incrementClickCount(link_id);

    logger.info('Click event recorded', {
      clickEventId: clickEvent.id,
      linkId: link_id,
      ip: clientIp,
      userAgent: clickEvent.user_agent,
    });

    res.status(201).json({
      success: true,
      click_event_id: clickEvent.id,
      timestamp: clickEvent.timestamp,
    });
  } catch (error) {
    logger.error('Error recording click event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to record click event.',
    });
  }
});

// GET /api/redirect/:linkId - Tracked redirect to affiliate link
router.get('/redirect/:linkId', async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Validate linkId format
    if (!linkId || !z.string().uuid().safeParse(linkId).success) {
      res.status(400).json({
        error: 'Invalid link ID',
        message: 'Link ID must be a valid UUID.',
      });
      return;
    }

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    // Get the affiliate link
    const affiliateLink = await AffiliateLinkModel.findById(linkId);
    if (!affiliateLink) {
      res.status(404).json({
        error: 'Link not found',
        message: 'The specified affiliate link does not exist.',
      });
      return;
    }

    // Check if link is active
    if (affiliateLink.status !== 'active') {
      res.status(410).json({
        error: 'Link unavailable',
        message: 'This affiliate link is no longer available.',
      });
      return;
    }

    // Record the click event
    const sessionId = (req.query.session_id as string) || generateSessionId();

    try {
      await ClickEventModel.create({
        link_id: linkId,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referer'),
        ip_address: clientIp,
        session_id: sessionId,
        country_code: req.query.country as string,
      });

      // Increment click count
      await AffiliateLinkModel.incrementClickCount(linkId);

      logger.info('Redirect click tracked', {
        linkId,
        title: affiliateLink.title,
        ip: clientIp,
        destination: affiliateLink.affiliate_url,
      });
    } catch (clickError) {
      // Log the error but don't fail the redirect
      logger.error('Error recording click for redirect:', clickError);
    }

    // Redirect to the affiliate URL
    res.redirect(302, affiliateLink.affiliate_url);
  } catch (error) {
    logger.error('Error in redirect endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process redirect.',
    });
  }
});

export { router as clicksRouter, clickRateLimit };
