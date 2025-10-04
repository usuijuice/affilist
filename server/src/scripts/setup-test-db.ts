#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { config } from '../config/environment.js';
import { migrator } from '../database/migrator.js';
import { logger } from '../utils/logger.js';

async function setupTestDatabase() {
  try {
    console.log('🧪 Setting up test database...\n');

    // Create test database if it doesn't exist
    const createDbCommand = `psql postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/postgres -c "CREATE DATABASE ${config.database.name};" 2>/dev/null || echo "Database already exists"`;

    console.log('📋 Creating test database...');
    execSync(createDbCommand, { stdio: 'inherit' });

    // Run migrations
    console.log('\n🔄 Running migrations...');
    await migrator.migrate();

    console.log('\n✅ Test database setup complete!');
  } catch (error) {
    logger.error('Failed to setup test database', error);
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();
