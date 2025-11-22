# Database Migration Guide

This guide will help you migrate your data from Neon DB to your own PostgreSQL database.

## Step 1: Set Up Environment Variables

Create a `.env` file in the project root (or update your existing one):

```env
# Your NEW database connection (target)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Your OLD Neon database connection (source)
NEON_DATABASE_URL=postgresql://neondb_owner:npg_jP7dqls4rpNf@ep-frosty-meadow-ahksg3ku.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Other required variables
SESSION_SECRET=your-session-secret-here
OPENAI_API_KEY=your-openai-key-here
```

**Important:** 
- `DATABASE_URL` = Your NEW database (where data will be imported)
- `NEON_DATABASE_URL` = Your OLD Neon database (where data will be exported from)

## Step 2: Create Tables in Your New Database

First, create all the tables in your new database by running the migration:

```bash
npm run db:migrate
```

This will create all the necessary tables in your new database.

## Step 3: Export Data from Neon

Export all data from your Neon database to JSON files:

```bash
node scripts/export-from-neon.js
```

This will:
- Connect to your Neon database (using `NEON_DATABASE_URL`)
- Export all tables to JSON files in `data-export/` directory
- Create a summary file with export statistics

**Output:** All data will be saved to `data-export/` directory as JSON files.

## Step 4: Import Data to Your New Database

Import all the exported data into your new database:

```bash
node scripts/import-to-database.js
```

This will:
- Connect to your new database (using `DATABASE_URL`)
- Import all JSON files from `data-export/` directory
- Handle conflicts gracefully (won't duplicate existing data)
- Show import statistics

## Step 5: Verify Migration

After importing, verify the data was migrated correctly:

```bash
# Connect to your new database
psql "your-database-connection-string"

# Check row counts
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'project_configs', COUNT(*) FROM project_configs
UNION ALL
SELECT 'credit_accounts', COUNT(*) FROM credit_accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'usage_records', COUNT(*) FROM usage_records
UNION ALL
SELECT 'ai_analyses', COUNT(*) FROM ai_analyses;
```

Compare these counts with your Neon database to ensure all data was migrated.

## Step 6: Update Application Configuration

After migration is complete:

1. **Remove Neon connection** from `.env`:
   ```env
   # Remove this line:
   # NEON_DATABASE_URL=...
   ```

2. **Keep only your new database**:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   ```

3. **Restart your application** to use the new database.

## Troubleshooting

### Export Fails

- **Check Neon connection**: Verify `NEON_DATABASE_URL` is correct
- **Check network**: Ensure you can reach Neon database
- **Check permissions**: Verify your Neon user has SELECT permissions

### Import Fails

- **Check tables exist**: Run `npm run db:migrate` first
- **Check foreign keys**: Import order matters - the script handles this automatically
- **Check data format**: JSON files should be valid JSON

### Data Missing After Import

- **Check export summary**: Review `data-export/export-summary.json`
- **Check import logs**: Look for error messages during import
- **Verify row counts**: Compare counts between Neon and new database

### Duplicate Key Errors

- The import script uses `ON CONFLICT DO NOTHING` to skip duplicates
- If you see duplicate errors, the table might have a unique constraint that's not being handled
- Check the specific table's constraints in the migration file

## Tables Migrated

The following tables will be migrated:

- `users` - User accounts
- `project_configs` - Project configurations
- `credit_accounts` - Credit account information
- `transactions` - Transaction history
- `usage_records` - Usage tracking records
- `ai_analyses` - AI analysis results
- `ai_keywords` - Keywords from analyses
- `ai_keyphrases` - Keyphrases from analyses
- `knowledge_base_files` - Knowledge base file metadata
- `shared_links` - Shared transcript links
- `gtm_credentials` - Google Tag Manager credentials
- `gtm_analytics_data` - GTM analytics data
- `gtm_traffic_sources` - GTM traffic sources
- `gtm_page_views` - GTM page views
- `gtm_referrers` - GTM referrers
- `gtm_keywords` - GTM keywords
- `gtm_campaigns` - GTM campaigns
- `shopify_credentials` - Shopify API credentials
- `wordpress_credentials` - WordPress API credentials
- `bigcommerce_credentials` - BigCommerce API credentials
- `squarespace_credentials` - Squarespace API credentials
- `wix_credentials` - Wix API credentials
- `webflow_credentials` - Webflow API credentials
- `products` - Product catalog
- `user_balances` - User balance information

## Notes

- The export/import process preserves all data including timestamps
- Foreign key relationships are maintained
- The import script skips duplicates automatically
- You can run the import multiple times safely (idempotent)

