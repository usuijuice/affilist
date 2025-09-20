import { Router, Request, Response } from 'express';
import { ClickEventModel } from '../database/models/ClickEvent.js';
import { AffiliateLinkModel } from '../database/models/AffiliateLink.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

const analyticsQuerySchema = z.object({
  link_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  format: z.enum(['json', 'csv']).optional(),
});

// Helper function to get date range
function getDateRange(query: any): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (query.start_date && query.end_date) {
    startDate = new Date(query.start_date);
    endDate = new Date(query.end_date);
  } else if (query.days) {
    startDate = new Date(now.getTime() - (query.days * 24 * 60 * 60 * 1000));
  } else {
    // Default to last 30 days
    startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  return { startDate, endDate };
}

// Helper function to format CSV response
function formatCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

// GET /api/admin/analytics - Main analytics dashboard data
router.get('/admin/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const dateValidation = dateRangeSchema.safeParse(req.query);
    const queryValidation = analyticsQuerySchema.safeParse(req.query);
    
    if (!dateValidation.success || !queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: {
          date: dateValidation.error?.errors,
          query: queryValidation.error?.errors,
        },
      });
    }

    const { startDate, endDate } = getDateRange(req.query);
    const { link_id, limit = 10 } = queryValidation.data;

    // Get total clicks
    const totalClicks = await ClickEventModel.getTotalClicks(link_id);
    
    // Get clicks by date range
    const clicksByDate = await ClickEventModel.getClicksByDateRange(startDate, endDate, link_id);
    
    // Get top performing links
    const topLinks = await ClickEventModel.getTopLinksByClicks(startDate, endDate, limit);
    
    // Get unique sessions count
    const uniqueSessions = await ClickEventModel.getUniqueSessionsCount(startDate, endDate, link_id);
    
    // Get clicks by hour for the date range
    const clicksByHour = await ClickEventModel.getClicksByHour(startDate, endDate, link_id);
    
    // Calculate total revenue (assuming commission rates)
    let totalRevenue = 0;
    for (const linkData of topLinks) {
      const link = await AffiliateLinkModel.findById(linkData.link_id);
      if (link && link.commission_rate) {
        // Simplified revenue calculation: clicks * commission_rate
        // In reality, this would be based on actual conversions
        totalRevenue += linkData.clicks * link.commission_rate;
      }
    }

    // Calculate click trends
    const totalClicksInRange = clicksByDate.reduce((sum, day) => sum + day.clicks, 0);
    const averageClicksPerDay = clicksByDate.length > 0 ? totalClicksInRange / clicksByDate.length : 0;
    
    // Calculate conversion rate (simplified - assuming 5% conversion rate)
    const estimatedConversions = Math.round(totalClicksInRange * 0.05);
    const conversionRate = totalClicksInRange > 0 ? (estimatedConversions / totalClicksInRange) * 100 : 0;

    const analyticsData = {
      summary: {
        total_clicks: totalClicks,
        total_revenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        unique_sessions: uniqueSessions,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_clicks_per_day: Math.round(averageClicksPerDay * 100) / 100,
        date_range: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      },
      clicks_by_date: clicksByDate,
      clicks_by_hour: clicksByHour,
      top_links: topLinks.map(link => ({
        ...link,
        revenue: link.clicks * 5, // Simplified revenue calculation
      })),
    };

    logger.info('Analytics data retrieved', {
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      totalClicks: totalClicks,
      linkId: link_id,
    });

    res.json({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    logger.error('Error retrieving analytics data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve analytics data.',
    });
  }
});

// GET /api/admin/analytics/export - Export analytics data
router.get('/admin/analytics/export', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const dateValidation = dateRangeSchema.safeParse(req.query);
    const queryValidation = analyticsQuerySchema.safeParse(req.query);
    
    if (!dateValidation.success || !queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: {
          date: dateValidation.error?.errors,
          query: queryValidation.error?.errors,
        },
      });
    }

    const { startDate, endDate } = getDateRange(req.query);
    const { format = 'json', limit = 100 } = queryValidation.data;

    // Get detailed click data for export
    const topLinks = await ClickEventModel.getTopLinksByClicks(startDate, endDate, limit);
    const clicksByDate = await ClickEventModel.getClicksByDateRange(startDate, endDate);
    
    const exportData = {
      generated_at: new Date().toISOString(),
      date_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      top_links: topLinks,
      clicks_by_date: clicksByDate,
    };

    if (format === 'csv') {
      // Export as CSV
      const topLinksCSV = formatCSV(topLinks, ['link_id', 'title', 'clicks']);
      const clicksByDateCSV = formatCSV(clicksByDate, ['date', 'clicks']);
      
      const csvContent = [
        '# Top Links',
        topLinksCSV,
        '',
        '# Clicks by Date',
        clicksByDateCSV,
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Export as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }

    logger.info('Analytics data exported', {
      format,
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    });

  } catch (error) {
    logger.error('Error exporting analytics data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export analytics data.',
    });
  }
});

// GET /api/admin/analytics/links/:linkId - Analytics for specific link
router.get('/admin/analytics/links/:linkId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    
    // Validate linkId format
    if (!z.string().uuid().safeParse(linkId).success) {
      return res.status(400).json({
        error: 'Invalid link ID format',
        message: 'Link ID must be a valid UUID.',
      });
    }

    // Validate query parameters
    const dateValidation = dateRangeSchema.safeParse(req.query);
    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: dateValidation.error.errors,
      });
    }

    // Check if link exists
    const link = await AffiliateLinkModel.findById(linkId);
    if (!link) {
      return res.status(404).json({
        error: 'Link not found',
        message: 'The specified affiliate link does not exist.',
      });
    }

    const { startDate, endDate } = getDateRange(req.query);

    // Get link-specific analytics
    const totalClicks = await ClickEventModel.getTotalClicks(linkId);
    const clicksByDate = await ClickEventModel.getClicksByDateRange(startDate, endDate, linkId);
    const clicksByHour = await ClickEventModel.getClicksByHour(startDate, endDate, linkId);
    const uniqueSessions = await ClickEventModel.getUniqueSessionsCount(startDate, endDate, linkId);

    // Calculate performance metrics
    const totalClicksInRange = clicksByDate.reduce((sum, day) => sum + day.clicks, 0);
    const averageClicksPerDay = clicksByDate.length > 0 ? totalClicksInRange / clicksByDate.length : 0;
    
    // Calculate estimated revenue
    const estimatedRevenue = link.commission_rate ? totalClicksInRange * link.commission_rate : 0;

    const linkAnalytics = {
      link: {
        id: link.id,
        title: link.title,
        url: link.url,
        affiliate_url: link.affiliate_url,
        commission_rate: link.commission_rate,
        featured: link.featured,
        status: link.status,
      },
      metrics: {
        total_clicks: totalClicks,
        clicks_in_range: totalClicksInRange,
        unique_sessions: uniqueSessions,
        average_clicks_per_day: Math.round(averageClicksPerDay * 100) / 100,
        estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
        date_range: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      },
      clicks_by_date: clicksByDate,
      clicks_by_hour: clicksByHour,
    };

    logger.info('Link analytics retrieved', {
      linkId,
      title: link.title,
      totalClicks,
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    });

    res.json({
      success: true,
      data: linkAnalytics,
    });

  } catch (error) {
    logger.error('Error retrieving link analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve link analytics.',
    });
  }
});

// GET /api/admin/analytics/performance - Performance metrics and trends
router.get('/admin/analytics/performance', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const dateValidation = dateRangeSchema.safeParse(req.query);
    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: dateValidation.error.errors,
      });
    }

    const { startDate, endDate } = getDateRange(req.query);

    // Get performance data
    const topLinks = await ClickEventModel.getTopLinksByClicks(startDate, endDate, 20);
    const clicksByDate = await ClickEventModel.getClicksByDateRange(startDate, endDate);
    
    // Calculate trends (compare with previous period)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const previousEndDate = new Date(startDate.getTime() - 1);
    
    const previousClicksByDate = await ClickEventModel.getClicksByDateRange(previousStartDate, previousEndDate);
    
    const currentPeriodClicks = clicksByDate.reduce((sum, day) => sum + day.clicks, 0);
    const previousPeriodClicks = previousClicksByDate.reduce((sum, day) => sum + day.clicks, 0);
    
    const clicksTrend = previousPeriodClicks > 0 
      ? ((currentPeriodClicks - previousPeriodClicks) / previousPeriodClicks) * 100 
      : 0;

    // Get link performance categories
    const highPerformers = topLinks.filter(link => link.clicks > 100);
    const mediumPerformers = topLinks.filter(link => link.clicks >= 10 && link.clicks <= 100);
    const lowPerformers = topLinks.filter(link => link.clicks < 10);

    // Calculate revenue by link (simplified)
    const revenueByLink = await Promise.all(
      topLinks.slice(0, 10).map(async (linkData) => {
        const link = await AffiliateLinkModel.findById(linkData.link_id);
        const revenue = link?.commission_rate ? linkData.clicks * link.commission_rate : 0;
        return {
          link_id: linkData.link_id,
          title: linkData.title,
          clicks: linkData.clicks,
          commission_rate: link?.commission_rate || 0,
          revenue: Math.round(revenue * 100) / 100,
        };
      })
    );

    const performanceData = {
      overview: {
        current_period_clicks: currentPeriodClicks,
        previous_period_clicks: previousPeriodClicks,
        clicks_trend_percentage: Math.round(clicksTrend * 100) / 100,
        total_links_tracked: topLinks.length,
        date_range: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      },
      performance_categories: {
        high_performers: {
          count: highPerformers.length,
          total_clicks: highPerformers.reduce((sum, link) => sum + link.clicks, 0),
        },
        medium_performers: {
          count: mediumPerformers.length,
          total_clicks: mediumPerformers.reduce((sum, link) => sum + link.clicks, 0),
        },
        low_performers: {
          count: lowPerformers.length,
          total_clicks: lowPerformers.reduce((sum, link) => sum + link.clicks, 0),
        },
      },
      revenue_by_link: revenueByLink,
      clicks_trend: clicksByDate,
    };

    logger.info('Performance analytics retrieved', {
      currentPeriodClicks,
      clicksTrend: clicksTrend.toFixed(2) + '%',
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    });

    res.json({
      success: true,
      data: performanceData,
    });

  } catch (error) {
    logger.error('Error retrieving performance analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve performance analytics.',
    });
  }
});

export { router as analyticsRouter };