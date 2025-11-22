# Database Setup Guide for PostgreSQL

## Connection String Format ✅

Your PostgreSQL connection string format:
```
postgresql://username:password@host:port/database?sslmode=require
```

**Format breakdown:**
- Protocol: `postgresql://` or `postgres://`
- Username: Your database username
- Password: Your database password
- Host: Your database host (IP or domain)
- Port: Your database port (default: 5432)
- Database: Your database name
- SSL Mode: `require` (for secure connections) or `disable` (for local development)

**Example:**
```
postgresql://myuser:mypassword@localhost:5432/mydb?sslmode=require
```

This works with any PostgreSQL-compatible database (PostgreSQL, TimescaleDB, Neon, Supabase, etc.).

## Setup Steps

### 1. Set Environment Variable

**For local development (.env file):**
```bash
# Replace with your own database connection string
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**For Render deployment:**
- Go to Render Dashboard → Your Service → Environment
- Add `DATABASE_URL` with your connection string
- Mark as "Secret" (sync: false)

### 2. Create Tables Manually

You have two options:

#### Option A: Using psql (Recommended)

```bash
# Connect to your database (replace with your connection string)
psql "postgresql://username:password@host:port/database?sslmode=require"

# Run the migration script
\i migrations/001_initial_schema.sql

# Or copy-paste the SQL directly
```

#### Option B: Using pgAdmin or DBeaver

1. Connect to your TimescaleDB instance
2. Open the SQL editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Execute the script

#### Option C: Using Node.js Script

```bash
# Install pg client (if not already installed)
npm install --save-dev pg

# Set DATABASE_URL environment variable (replace with your connection string)
export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Run the migration script
npm run db:migrate
# Or directly:
node scripts/run-migration.js
```

### 3. Verify Tables Created

After running the migration, verify tables exist:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show:
-- ai_analyses
-- ai_keyphrases
-- ai_keywords
-- credit_accounts
-- knowledge_base_files
-- project_configs
-- shared_links
-- transactions
-- usage_records
-- users
```

### 4. (Optional) Enable TimescaleDB Hypertables

If you want to use TimescaleDB's time-series features for better performance on time-based queries:

```sql
-- Convert usage_records to hypertable
SELECT create_hypertable('usage_records', 'created_at', if_not_exists => TRUE);

-- Convert transactions to hypertable
SELECT create_hypertable('transactions', 'created_at', if_not_exists => TRUE);

-- Convert ai_analyses to hypertable
SELECT create_hypertable('ai_analyses', 'created_at', if_not_exists => TRUE);
```

**Benefits:**
- Faster queries on time-based data
- Automatic data retention policies
- Compression for older data
- Better performance for analytics

## Tables Created

The migration creates the following tables:

1. **users** - User authentication and API credentials
2. **shared_links** - Transcript sharing links
3. **knowledge_base_files** - Knowledge base file metadata
4. **project_configs** - Legacy project configuration
5. **credit_accounts** - Credit account management
6. **transactions** - Credit purchases and deductions
7. **usage_records** - Usage tracking records
8. **ai_analyses** - AI analysis results
9. **ai_keywords** - Keywords from AI analysis
10. **ai_keyphrases** - Keyphrases from AI analysis

## Testing the Connection

Test your connection string:

```bash
# Using psql
psql "postgres://tsdbadmin:m85njgqs9yxbfen8@n9hlz915l7.t6kgewgkh0.tsdb.cloud.timescale.com:30205/tsdb?sslmode=require"

# Test query
SELECT version();
SELECT current_database();
```

Or using Node.js:

```javascript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const result = await sql`SELECT version()`;
console.log(result);
```

## Next Steps

1. ✅ Run the migration script to create tables
2. ✅ Verify tables are created
3. ✅ Update your application to use database storage (currently uses in-memory storage)
4. ✅ Test database operations

## Troubleshooting

### Connection Issues

- **SSL Required**: Your connection string includes `sslmode=require`, which is correct for cloud databases. For local development, you can use `sslmode=disable`
- **Firewall**: Ensure your IP is whitelisted in your database provider's dashboard (if applicable)
- **Credentials**: Double-check username and password
- **Connection**: Verify the host, port, and database name are correct

### Migration Errors

- **UUID Extension**: The script enables `uuid-ossp` extension automatically
- **Table Already Exists**: The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- **Foreign Key Errors**: Ensure parent tables are created before child tables (the script handles this)

### Database-Specific Notes

- **PostgreSQL**: Standard PostgreSQL works perfectly with this setup
- **TimescaleDB**: If using TimescaleDB, you can optionally create hypertables for time-series features
- **Cloud Databases**: Most cloud PostgreSQL providers (AWS RDS, Google Cloud SQL, Azure Database, etc.) work with this setup

## Support

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Drizzle ORM Docs: https://orm.drizzle.team/

