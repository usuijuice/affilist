#!/usr/bin/env tsx

import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...\n');

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    const tablesResult = await db.query(tablesQuery);
    console.log('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('  No tables found');
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check indexes
    const indexesQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const indexesResult = await db.query(indexesQuery);
    console.log('\n🔗 Existing indexes:');
    if (indexesResult.rows.length === 0) {
      console.log('  No indexes found');
    } else {
      indexesResult.rows.forEach((row) => {
        console.log(`  - ${row.indexname} on ${row.tablename}`);
      });
    }

    // Check migrations table
    const migrationsQuery = `
      SELECT id, filename, executed_at 
      FROM migrations 
      ORDER BY executed_at;
    `;

    try {
      const migrationsResult = await db.query(migrationsQuery);
      console.log('\n📝 Migration history:');
      if (migrationsResult.rows.length === 0) {
        console.log('  No migrations executed');
      } else {
        migrationsResult.rows.forEach((row) => {
          console.log(`  - ${row.id} (${row.filename}) - ${row.executed_at}`);
        });
      }
    } catch (error) {
      console.log('\n📝 Migration history: migrations table does not exist');
    }

    // Check for specific problematic indexes that might cause conflicts
    const problematicIndexes = [
      'idx_affiliate_links_category_id',
      'idx_affiliate_links_status',
      'idx_affiliate_links_featured',
      'idx_affiliate_links_created_at',
      'idx_affiliate_links_click_count',
      'idx_affiliate_links_search',
      'idx_click_events_link_id',
      'idx_click_events_timestamp',
      'idx_click_events_session_id',
      'idx_categories_slug',
    ];

    console.log('\n⚠️  Checking for potentially conflicting indexes:');
    for (const indexName of problematicIndexes) {
      const checkQuery = `
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = $1 AND schemaname = 'public';
      `;
      const result = await db.query(checkQuery, [indexName]);
      if (result.rows.length > 0) {
        console.log(`  ❌ ${indexName} already exists`);
      } else {
        console.log(`  ✅ ${indexName} does not exist`);
      }
    }
  } catch (error) {
    logger.error('Failed to check database state', error);
    console.error('❌ Error checking database state:', error);
  } finally {
    await db.close();
  }
}

checkDatabaseState();
