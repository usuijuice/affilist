#!/usr/bin/env tsx

import { migrator } from '../database/migrator.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const command = process.argv[2];
const arg = process.argv[3];

async function runMigrations() {
  try {
    switch (command) {
      case 'up':
      case 'migrate':
        logger.info('Running database migrations...');
        await migrator.migrate();
        logger.info('Migrations completed successfully');
        break;

      case 'status':
        logger.info('Checking migration status...');
        const migrations = await migrator.status();
        if (migrations.length === 0) {
          logger.info('No migrations have been executed');
        } else {
          logger.info(`Executed migrations (${migrations.length}):`);
          migrations.forEach((migration) => {
            logger.info(`  - ${migration.filename} (${migration.executed_at})`);
          });
        }
        break;

      case 'rollback':
        const steps = arg ? parseInt(arg, 10) : 1;
        if (isNaN(steps) || steps < 1) {
          logger.error(
            'Invalid rollback steps. Please provide a positive number.'
          );
          process.exit(1);
        }
        logger.info(`Rolling back ${steps} migration(s)...`);
        await migrator.rollback(steps);
        logger.info('Rollback completed');
        break;

      default:
        logger.info('Database Migration Tool');
        logger.info('');
        logger.info('Usage:');
        logger.info('  npm run migrate up        - Run all pending migrations');
        logger.info('  npm run migrate status    - Show migration status');
        logger.info(
          '  npm run migrate rollback [steps] - Rollback migrations (default: 1)'
        );
        logger.info('');
        logger.info('Examples:');
        logger.info('  npm run migrate up');
        logger.info('  npm run migrate status');
        logger.info('  npm run migrate rollback 2');
        break;
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run the migration command
runMigrations();
