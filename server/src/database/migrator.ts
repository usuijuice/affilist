import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Migration {
  id: string;
  filename: string;
  executed_at?: Date;
}

export class DatabaseMigrator {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = join(__dirname, 'migrations');
  }

  private async ensureMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await db.query(createTableQuery);
    logger.debug('Migrations table ensured');
  }

  private async getExecutedMigrations(): Promise<Migration[]> {
    const result = await db.query<Migration>(
      'SELECT id, filename, executed_at FROM migrations ORDER BY executed_at ASC'
    );
    return result.rows;
  }

  private async getMigrationFiles(): Promise<string[]> {
    const fs = await import('fs/promises');
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure consistent ordering
    } catch (error) {
      logger.error('Failed to read migrations directory', error);
      throw new Error('Could not read migrations directory');
    }
  }

  private async executeMigration(filename: string): Promise<void> {
    const filePath = join(this.migrationsPath, filename);
    const migrationId = filename.replace('.sql', '');
    
    try {
      const sql = await readFile(filePath, 'utf-8');
      
      await db.transaction(async (client) => {
        // Execute the migration SQL
        await client.query(sql);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
          [migrationId, filename]
        );
      });
      
      logger.info(`Migration executed successfully: ${filename}`);
    } catch (error) {
      logger.error(`Failed to execute migration: ${filename}`, error);
      throw error;
    }
  }

  public async migrate(): Promise<void> {
    try {
      logger.info('Starting database migration...');
      
      // Ensure migrations table exists
      await this.ensureMigrationsTable();
      
      // Get executed migrations and available migration files
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);
      
      const executedIds = new Set(executedMigrations.map(m => m.id));
      const pendingMigrations = migrationFiles.filter(file => {
        const migrationId = file.replace('.sql', '');
        return !executedIds.has(migrationId);
      });
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const filename of pendingMigrations) {
        await this.executeMigration(filename);
      }
      
      logger.info(`Successfully executed ${pendingMigrations.length} migrations`);
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  }

  public async rollback(steps: number = 1): Promise<void> {
    try {
      logger.info(`Rolling back ${steps} migration(s)...`);
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationsToRollback = executedMigrations
        .slice(-steps)
        .reverse(); // Rollback in reverse order
      
      if (migrationsToRollback.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      for (const migration of migrationsToRollback) {
        await db.transaction(async (client) => {
          // Remove migration record
          await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
        });
        
        logger.info(`Rolled back migration: ${migration.filename}`);
      }
      
      logger.warn('Note: SQL rollback must be done manually. Only migration records were removed.');
    } catch (error) {
      logger.error('Rollback failed', error);
      throw error;
    }
  }

  public async status(): Promise<Migration[]> {
    await this.ensureMigrationsTable();
    return this.getExecutedMigrations();
  }
}

export const migrator = new DatabaseMigrator();