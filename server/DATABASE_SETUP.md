# Database Setup Guide

This guide explains how to set up PostgreSQL for the Affilist server.

## Prerequisites

- PostgreSQL 12+ installed locally
- Node.js 18+ and npm

## Local Development Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

Connect to PostgreSQL as the postgres user:
```bash
psql -U postgres
```

Create the database and user:
```sql
CREATE DATABASE affilist;
CREATE USER affilist_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE affilist TO affilist_user;
\q
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:
```env
# Database Configuration
DATABASE_URL=postgresql://affilist_user:your_password@localhost:5432/affilist
DB_HOST=localhost
DB_PORT=5432
DB_NAME=affilist
DB_USER=affilist_user
DB_PASSWORD=your_password

# JWT Configuration (required)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Run Database Migrations

Run the initial database setup:
```bash
npm run migrate:up
```

Check migration status:
```bash
npm run migrate:status
```

### 5. Verify Setup

Start the server:
```bash
npm run dev
```

Check the health endpoint:
```bash
curl http://localhost:3001/ready
```

You should see a response with `"database": "healthy"`.

## Testing

### Running Tests with Database

To run tests that require database connectivity:

1. Ensure PostgreSQL is running
2. Create a test database:
   ```sql
   CREATE DATABASE affilist_test;
   GRANT ALL PRIVILEGES ON DATABASE affilist_test TO affilist_user;
   ```

3. Set test environment variables:
   ```bash
   export NODE_ENV=test
   export DATABASE_URL=postgresql://affilist_user:your_password@localhost:5432/affilist_test
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Running Tests without Database

To run only tests that don't require database connectivity:
```bash
npm run test:run -- src/__tests__/logger.test.ts
```

## Production Setup

For production deployment:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Set strong passwords and proper security groups
3. Use SSL connections
4. Set up database backups
5. Monitor database performance

Example production environment variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@your-db-host:5432/affilist
JWT_SECRET=your-production-jwt-secret
```

## Troubleshooting

### Connection Refused Error

If you see `ECONNREFUSED` errors:
1. Ensure PostgreSQL is running: `brew services list | grep postgresql`
2. Check if the port is correct (default: 5432)
3. Verify database credentials
4. Check firewall settings

### Migration Errors

If migrations fail:
1. Check database permissions
2. Ensure the database exists
3. Verify the migrations directory exists
4. Check for syntax errors in migration files

### Permission Errors

If you get permission errors:
```sql
-- Connect as postgres user and grant permissions
GRANT ALL PRIVILEGES ON DATABASE affilist TO affilist_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO affilist_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO affilist_user;
```

## Database Schema

The database includes the following main tables:

- `categories` - Product/service categories
- `affiliate_links` - Affiliate link records
- `click_events` - Click tracking data
- `admin_users` - Admin user accounts
- `migrations` - Migration tracking

See the migration files in `src/database/migrations/` for detailed schema definitions.