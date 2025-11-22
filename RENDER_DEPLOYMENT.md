# Render Deployment Guide

This guide will help you deploy SaasDashKit_V1 to Render.

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to `https://github.com/tristan1944/SaasDashKit_V1`
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Neon Database**: Create a PostgreSQL database at [neon.tech](https://neon.tech) or use Render's PostgreSQL

## Step 1: Push Code to GitHub

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Render deployment"

# Push to GitHub
git push origin main
```

Or use the provided sync script:
```bash
bash github-sync.sh
```

## Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **`tristan1944/SaasDashKit_V1`**
5. Render will automatically detect the `render.yaml` file

## Step 3: Configure Environment Variables

In the Render dashboard, go to your service → **Environment** tab and add:

### Required Variables:

- **`DATABASE_URL`**: Your PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database?sslmode=require`
  - Example: `postgresql://myuser:mypassword@db.example.com:5432/mydb?sslmode=require`
  - **Important**: After setting DATABASE_URL, you need to manually create tables (see `DATABASE_SETUP.md`)

- **`SESSION_SECRET`**: A random secret string for session encryption
  - Generate one: `openssl rand -hex 32`
  - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- **`OPENAI_API_KEY`**: Your OpenAI API key (for AI Analysis feature)
  - Format: `sk-proj-...` or `sk-...`

- **`VOICEFLOW_API_KEY`**: Your Voiceflow API key (optional, can be set in UI)
  - Format: `VF.DM.xxxx...`

### Optional Variables:

- **`NODE_ENV`**: Set to `production` (already in render.yaml)
- **`NODE_VERSION`**: Set to `20.17.0` (already in render.yaml)

## Step 4: Configure Persistent Disks

The `render.yaml` already configures two persistent disks:

1. **app-data** (1GB): For uploaded files
   - Mount: `/opt/render/project/src/uploads`

2. **ai-data** (1GB): For AI analysis data
   - Mount: `/opt/render/project/src/server/data/ai-analysis`

These will be automatically created when you deploy using `render.yaml`.

## Step 5: Database Setup

**Important**: You need to manually create the database tables before the app can work.

### Option A: Using Migration Script (Recommended)

1. Connect to your database using a PostgreSQL client (psql, pgAdmin, DBeaver, etc.)
2. Run the SQL migration script:
   ```bash
   # Copy the contents of migrations/001_initial_schema.sql
   # Execute it in your database client
   ```

   Or use the Node.js script locally:
   ```bash
   export DATABASE_URL="your-database-url"
   npm run db:migrate
   ```

### Option B: Using Render Shell

1. Go to your Render service → **Shell** tab
2. Run:
   ```bash
   npm run db:migrate
   ```

### Option C: Manual SQL Execution

1. Connect to your database (TimescaleDB Cloud dashboard, psql, etc.)
2. Copy contents of `migrations/001_initial_schema.sql`
3. Execute the SQL script

**See `DATABASE_SETUP.md` for detailed instructions.**

## Step 6: Deploy

1. Click **"Create Web Service"** in Render
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Run `npm run build`
   - Start the service with `npm run start`
3. Monitor the build logs for any errors

## Step 7: Verify Deployment

1. Once deployed, Render will provide a URL like: `https://saasdashkit.onrender.com`
2. Visit the URL and verify:
   - ✅ Login page loads
   - ✅ Can create an account
   - ✅ Dashboard loads
   - ✅ API endpoints respond

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version matches (20.17.0)

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Render's IPs
- Ensure database is provisioned and running

### Environment Variables Not Working

- Variables marked `sync: false` in `render.yaml` must be set manually in Render dashboard
- Restart the service after adding/updating environment variables

### Static Files Not Serving

- Ensure `npm run build` completes successfully
- Check that `dist/` folder contains built files
- Verify `serveStatic` is configured correctly in `server/index.ts`

## Render Configuration Reference

The `render.yaml` file contains:

```yaml
services:
  - type: web
    name: saasdashkit
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm run start"
    envVars:
      - key: NODE_VERSION
        value: 20.17.0
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Must be set manually
      - key: SESSION_SECRET
        sync: false  # Must be set manually
      - key: OPENAI_API_KEY
        sync: false  # Must be set manually
      - key: VOICEFLOW_API_KEY
        sync: false  # Must be set manually
    disks:
      - name: app-data
        mountPath: /opt/render/project/src/uploads
        sizeGB: 1
      - name: ai-data
        mountPath: /opt/render/project/src/server/data/ai-analysis
        sizeGB: 1
```

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- GitHub Issues: https://github.com/tristan1944/SaasDashKit_V1/issues

