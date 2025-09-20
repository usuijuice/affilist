#!/usr/bin/env tsx

import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

async function resetDatabase() {
  try {
    console.log('🧹 Resetting database...\n');

    // Drop all tables in the correct order (respecting foreign key constraints)
    const dropTablesQueries = [
      'DROP TABLE IF EXISTS click_events CASCADE;',
      'DROP TABLE IF EXISTS affiliate_links CASCADE;',
      'DROP TABLE IF EXISTS categories CASCADE;',
      'DROP TABLE IF EXISTS admin_users CASCADE;',
      'DROP TABLE IF EXISTS migrations CASCADE;',
    ];

    console.log('📋 Dropping existing tables...');
    for (const query of dropTablesQueries) {
      try {
        await db.query(query);
        const tableName = query.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
        console.log(`  ✅ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop table: ${error}`);
      }
    }

    // Drop functions if they exist
    const dropFunctionsQueries = [
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
      'DROP FUNCTION IF EXISTS update_link_click_count() CASCADE;',
    ];

    console.log('\n🔧 Dropping existing functions...');
    for (const query of dropFunctionsQueries) {
      try {
        await db.query(query);
        const functionName = query.match(/DROP FUNCTION IF EXISTS (\w+)/)?.[1];
        console.log(`  ✅ Dropped function: ${functionName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop function: ${error}`);
      }
    }

    // Drop extension (optional, might be used by other databases)
    try {
      await db.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
      console.log('  ✅ Dropped extension: uuid-ossp');
    } catch (error) {
      console.log('  ⚠️  Could not drop extension uuid-ossp (might be in use)');
    }

    console.log('\n✨ Database reset complete! You can now run migrations.');
  } catch (error) {
    logger.error('Failed to reset database', error);
    console.error('❌ Error resetting database:', error);
  } finally {
    await db.close();
  }
}

resetDatabase();
