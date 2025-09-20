import { db } from '../connection.js';
import type { 
  AdminUser, 
  CreateAdminUserInput, 
  UpdateAdminUserInput,
  PaginationOptions,
  PaginatedResult 
} from './types.js';

export class AdminUserModel {
  static async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Omit<AdminUser, 'password_hash'>>> {
    const { limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'DESC' } = options;
    
    const countQuery = 'SELECT COUNT(*) as total FROM admin_users';
    const countResult = await db.query(countQuery);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT id, email, name, role, last_login, created_at, updated_at
      FROM admin_users 
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query<Omit<AdminUser, 'password_hash'>>(query, [limit, offset]);
    
    return {
      data: result.rows,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };
  }

  static async findById(id: string): Promise<Omit<AdminUser, 'password_hash'> | null> {
    const query = `
      SELECT id, email, name, role, last_login, created_at, updated_at
      FROM admin_users 
      WHERE id = $1
    `;
    const result = await db.query<Omit<AdminUser, 'password_hash'>>(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM admin_users WHERE email = $1';
    const result = await db.query<AdminUser>(query, [email]);
    return result.rows[0] || null;
  }

  static async findByEmailWithoutPassword(email: string): Promise<Omit<AdminUser, 'password_hash'> | null> {
    const query = `
      SELECT id, email, name, role, last_login, created_at, updated_at
      FROM admin_users 
      WHERE email = $1
    `;
    const result = await db.query<Omit<AdminUser, 'password_hash'>>(query, [email]);
    return result.rows[0] || null;
  }

  static async create(input: CreateAdminUserInput): Promise<Omit<AdminUser, 'password_hash'>> {
    const query = `
      INSERT INTO admin_users (email, name, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role, last_login, created_at, updated_at
    `;
    
    const values = [
      input.email,
      input.name,
      input.password_hash,
      input.role || 'editor',
    ];
    
    const result = await db.query<Omit<AdminUser, 'password_hash'>>(query, values);
    return result.rows[0];
  }

  static async update(id: string, input: UpdateAdminUserInput): Promise<Omit<AdminUser, 'password_hash'> | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(input.email);
    }
    if (input.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(input.name);
    }
    if (input.password_hash !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(input.password_hash);
    }
    if (input.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(input.role);
    }
    if (input.last_login !== undefined) {
      fields.push(`last_login = $${paramCount++}`);
      values.push(input.last_login);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE admin_users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, last_login, created_at, updated_at
    `;

    const result = await db.query<Omit<AdminUser, 'password_hash'>>(query, values);
    return result.rows[0] || null;
  }

  static async updateLastLogin(id: string): Promise<void> {
    const query = 'UPDATE admin_users SET last_login = NOW() WHERE id = $1';
    await db.query(query, [id]);
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM admin_users WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async exists(field: 'id' | 'email', value: string): Promise<boolean> {
    const query = `SELECT 1 FROM admin_users WHERE ${field} = $1 LIMIT 1`;
    const result = await db.query(query, [value]);
    return result.rows.length > 0;
  }

  static async getPasswordHash(email: string): Promise<string | null> {
    const query = 'SELECT password_hash FROM admin_users WHERE email = $1';
    const result = await db.query<{ password_hash: string }>(query, [email]);
    return result.rows[0]?.password_hash || null;
  }
}