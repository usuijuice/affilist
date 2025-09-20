import { db } from '../connection.js';
import type { 
  ClickEvent, 
  CreateClickEventInput,
  PaginationOptions,
  PaginatedResult 
} from './types.js';

export class ClickEventModel {
  static async create(input: CreateClickEventInput): Promise<ClickEvent> {
    const query = `
      INSERT INTO click_events (
        link_id, user_agent, referrer, ip_address, session_id, country_code
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      input.link_id,
      input.user_agent || null,
      input.referrer || null,
      input.ip_address || null,
      input.session_id || null,
      input.country_code || null,
    ];
    
    const result = await db.query<ClickEvent>(query, values);
    return result.rows[0];
  }

  static async findByLinkId(
    linkId: string, 
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ClickEvent>> {
    const { limit = 50, offset = 0, sort_by = 'timestamp', sort_order = 'DESC' } = options;
    
    const countQuery = 'SELECT COUNT(*) as total FROM click_events WHERE link_id = $1';
    const countResult = await db.query(countQuery, [linkId]);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT * FROM click_events 
      WHERE link_id = $1
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query<ClickEvent>(query, [linkId, limit, offset]);
    
    return {
      data: result.rows,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };
  }

  static async getClicksByDateRange(
    startDate: Date, 
    endDate: Date, 
    linkId?: string
  ): Promise<{ date: string; clicks: number }[]> {
    let query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*)::integer as clicks
      FROM click_events 
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const params: any[] = [startDate, endDate];
    
    if (linkId) {
      query += ' AND link_id = $3';
      params.push(linkId);
    }
    
    query += `
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;
    
    const result = await db.query<{ date: string; clicks: number }>(query, params);
    return result.rows;
  }

  static async getTopLinksByClicks(
    startDate: Date, 
    endDate: Date, 
    limit: number = 10
  ): Promise<{ link_id: string; clicks: number; title: string }[]> {
    const query = `
      SELECT 
        ce.link_id,
        COUNT(*)::integer as clicks,
        al.title
      FROM click_events ce
      JOIN affiliate_links al ON ce.link_id = al.id
      WHERE ce.timestamp >= $1 AND ce.timestamp <= $2
      GROUP BY ce.link_id, al.title
      ORDER BY clicks DESC
      LIMIT $3
    `;
    
    const result = await db.query<{ link_id: string; clicks: number; title: string }>(
      query, 
      [startDate, endDate, limit]
    );
    return result.rows;
  }

  static async getTotalClicks(linkId?: string): Promise<number> {
    let query = 'SELECT COUNT(*)::integer as total FROM click_events';
    const params: any[] = [];
    
    if (linkId) {
      query += ' WHERE link_id = $1';
      params.push(linkId);
    }
    
    const result = await db.query<{ total: number }>(query, params);
    return result.rows[0]?.total || 0;
  }

  static async getClicksByHour(
    startDate: Date, 
    endDate: Date, 
    linkId?: string
  ): Promise<{ hour: number; clicks: number }[]> {
    let query = `
      SELECT 
        EXTRACT(HOUR FROM timestamp)::integer as hour,
        COUNT(*)::integer as clicks
      FROM click_events 
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const params: any[] = [startDate, endDate];
    
    if (linkId) {
      query += ' AND link_id = $3';
      params.push(linkId);
    }
    
    query += `
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour ASC
    `;
    
    const result = await db.query<{ hour: number; clicks: number }>(query, params);
    return result.rows;
  }

  static async getUniqueSessionsCount(
    startDate: Date, 
    endDate: Date, 
    linkId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(DISTINCT session_id)::integer as unique_sessions 
      FROM click_events 
      WHERE timestamp >= $1 AND timestamp <= $2 AND session_id IS NOT NULL
    `;
    
    const params: any[] = [startDate, endDate];
    
    if (linkId) {
      query += ' AND link_id = $3';
      params.push(linkId);
    }
    
    const result = await db.query<{ unique_sessions: number }>(query, params);
    return result.rows[0]?.unique_sessions || 0;
  }

  static async deleteOldEvents(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const query = 'DELETE FROM click_events WHERE timestamp < $1';
    const result = await db.query(query, [cutoffDate]);
    return result.rowCount ?? 0;
  }
}