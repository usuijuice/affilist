import { beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import { migrator } from '../database/migrator.js';
import { db } from '../database/connection.js';

// Load test environment variables
config({ path: '.env.test' });

beforeAll(async () => {
  // Set required environment variables for testing
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  
  // Override database URL for tests
  process.env.DATABASE_URL = 'postgresql://affilist_user:password@localhost:5432/affilist_test';
  process.env.DB_NAME = 'affilist_test';

  // Ensure test database is set up with migrations
  try {
    await migrator.migrate();
  } catch (error) {
    console.warn('Migration failed during test setup:', error);
    // Continue with tests even if migration fails (tables might already exist)
  }
});

afterAll(async () => {
  // Close database connections after all tests
  try {
    await db.close();
  } catch (error) {
    console.warn('Error closing database connection:', error);
  }
});
