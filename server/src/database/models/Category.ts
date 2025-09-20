import { db } from '../connection.js';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  PaginationOptions,
  PaginatedResult,
} from './types.js';

export class CategoryModel {
  static async findAll(
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Category>> {
    const {
      limit = 50,
      offset = 0,
      sort_by = 'name',
      sort_order = 'ASC',
    } = options;

    const countQuery = 'SELECT COUNT(*) as total FROM categories';
    const countResult = await db.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT * FROM categories 
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query<Category>(query, [limit, offset]);

    return {
      data: result.rows,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };
  }

  static async findById(id: string): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await db.query<Category>(query, [id]);
    return result.rows[0] || null;
  }

  static async findBySlug(slug: string): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE slug = $1';
    const result = await db.query<Category>(query, [slug]);
    return result.rows[0] || null;
  }

  static async create(input: CreateCategoryInput): Promise<Category> {
    const query = `
      INSERT INTO categories (name, slug, description, color, icon)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      input.name,
      input.slug,
      input.description || null,
      input.color || '#3B82F6',
      input.icon || null,
    ];

    const result = await db.query<Category>(query, values);
    return result.rows[0];
  }

  static async update(
    id: string,
    input: UpdateCategoryInput
  ): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      fields.push(`slug = $${paramCount++}`);
      values.push(input.slug);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(input.description);
    }
    if (input.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(input.color);
    }
    if (input.icon !== undefined) {
      fields.push(`icon = $${paramCount++}`);
      values.push(input.icon);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE categories 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query<Category>(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM categories WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getCategoriesWithLinkCount(): Promise<
    (Category & { link_count: number })[]
  > {
    const query = `
      SELECT 
        c.*,
        COUNT(al.id)::integer as link_count
      FROM categories c
      LEFT JOIN affiliate_links al ON c.id = al.category_id AND al.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    const result = await db.query<Category & { link_count: number }>(query);
    return result.rows;
  }

  static async exists(field: 'id' | 'slug', value: string): Promise<boolean> {
    const query = `SELECT 1 FROM categories WHERE ${field} = $1 LIMIT 1`;
    const result = await db.query(query, [value]);
    return result.rows.length > 0;
  }
}
