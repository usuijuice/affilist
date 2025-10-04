import { db } from '../connection.js';
import type {
  AffiliateLink,
  CreateAffiliateLinkInput,
  UpdateAffiliateLinkInput,
  AffiliateLinkFilters,
  PaginationOptions,
  PaginatedResult,
} from './types.js';

export class AffiliateLinkModel {
  static async findAll(
    filters: AffiliateLinkFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<AffiliateLink>> {
    const {
      limit = 20,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = options;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (filters.category_id) {
      whereConditions.push(`al.category_id = $${paramCount++}`);
      queryParams.push(filters.category_id);
    }

    if (filters.status) {
      whereConditions.push(`al.status = $${paramCount++}`);
      queryParams.push(filters.status);
    }

    if (filters.featured !== undefined) {
      whereConditions.push(`al.featured = $${paramCount++}`);
      queryParams.push(filters.featured);
    }

    if (filters.search) {
      whereConditions.push(`
        to_tsvector('english', al.title || ' ' || al.description || ' ' || array_to_string(al.tags, ' '))
        @@ plainto_tsquery('english', $${paramCount++})
      `);
      queryParams.push(filters.search);
    }

    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(`al.tags && $${paramCount++}`);
      queryParams.push(filters.tags);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM affiliate_links al 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT al.* 
      FROM affiliate_links al 
      ${whereClause}
      ORDER BY al.${sort_by} ${sort_order}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query<AffiliateLink>(query, queryParams);

    return {
      data: result.rows,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };
  }

  static async findById(id: string): Promise<AffiliateLink | null> {
    const query = 'SELECT * FROM affiliate_links WHERE id = $1';
    const result = await db.query<AffiliateLink>(query, [id]);
    return result.rows[0] || null;
  }

  static async findWithCategory(
    id: string
  ): Promise<(AffiliateLink & { category: any }) | null> {
    const query = `
      SELECT 
        al.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'color', c.color,
          'icon', c.icon
        ) as category
      FROM affiliate_links al
      JOIN categories c ON al.category_id = c.id
      WHERE al.id = $1
    `;

    const result = await db.query<AffiliateLink & { category: any }>(query, [
      id,
    ]);
    return result.rows[0] || null;
  }

  static async create(input: CreateAffiliateLinkInput): Promise<AffiliateLink> {
    const query = `
      INSERT INTO affiliate_links (
        title, description, url, affiliate_url, category_id, 
        tags, image_url, commission_rate, featured, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      input.title,
      input.description,
      input.url,
      input.affiliate_url,
      input.category_id,
      input.tags || [],
      input.image_url || null,
      input.commission_rate || null,
      input.featured || false,
      input.status || 'active',
    ];

    const result = await db.query<AffiliateLink>(query, values);
    return result.rows[0];
  }

  static async update(
    id: string,
    input: UpdateAffiliateLinkInput
  ): Promise<AffiliateLink | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(input.title);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(input.description);
    }
    if (input.url !== undefined) {
      fields.push(`url = $${paramCount++}`);
      values.push(input.url);
    }
    if (input.affiliate_url !== undefined) {
      fields.push(`affiliate_url = $${paramCount++}`);
      values.push(input.affiliate_url);
    }
    if (input.category_id !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(input.category_id);
    }
    if (input.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(input.tags);
    }
    if (input.image_url !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(input.image_url);
    }
    if (input.commission_rate !== undefined) {
      fields.push(`commission_rate = $${paramCount++}`);
      values.push(input.commission_rate);
    }
    if (input.featured !== undefined) {
      fields.push(`featured = $${paramCount++}`);
      values.push(input.featured);
    }
    if (input.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(input.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE affiliate_links 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query<AffiliateLink>(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM affiliate_links WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async incrementClickCount(id: string): Promise<void> {
    const query =
      'UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = $1';
    await db.query(query, [id]);
  }

  static async getFeatured(limit: number = 10): Promise<AffiliateLink[]> {
    const query = `
      SELECT * FROM affiliate_links 
      WHERE featured = true AND status = 'active'
      ORDER BY click_count DESC, created_at DESC
      LIMIT $1
    `;

    const result = await db.query<AffiliateLink>(query, [limit]);
    return result.rows;
  }

  static async getPopular(limit: number = 10): Promise<AffiliateLink[]> {
    const query = `
      SELECT * FROM affiliate_links 
      WHERE status = 'active'
      ORDER BY click_count DESC, created_at DESC
      LIMIT $1
    `;

    const result = await db.query<AffiliateLink>(query, [limit]);
    return result.rows;
  }

  static async exists(id: string): Promise<boolean> {
    const query = 'SELECT 1 FROM affiliate_links WHERE id = $1 LIMIT 1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }
}
