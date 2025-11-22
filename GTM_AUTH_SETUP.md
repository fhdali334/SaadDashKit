# GTM Authentication Setup Guide

This document outlines the complete GTM (Google Tag Manager) authentication and integration setup.

## ✅ Completed Steps

### Step 1: Update Frontend to Fetch from APIs ✅
- Replaced mock data loading with real API calls using `useQuery`
- Added API endpoints for all GTM data types
- Implemented loading states and error handling
- Added "Load Sample Data" button for initial data population

### Step 2: Implement GTM OAuth 2.0 Flow ✅
- Created OAuth 2.0 authentication flow
- Added connect/disconnect UI in GTM Charts tab
- Implemented secure token storage in database
- Added OAuth callback handler

### Step 3: Replace Mock Data with Real GTM API Calls ✅
- Created `syncGtmData()` function to fetch real GTM data
- Fetches containers, tags, triggers, and variables from GTM API
- Added `/api/gtm/sync` endpoint
- **Note**: GTM doesn't provide analytics data (page views, sessions). For those metrics, you need Google Analytics API integration.

### Step 4: Add Token Refresh Logic ✅
- Implemented automatic token refresh when tokens expire or are about to expire (5 min buffer)
- Added retry logic on 401 errors with automatic token refresh
- Created `callGtmApi()` wrapper for all GTM API calls with automatic refresh

## 🔧 Required Environment Variables

Add these to your `.env` file or Render environment variables:

```bash
# Google OAuth 2.0 Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gtm/oauth/callback
# For production: https://your-domain.com/api/gtm/oauth/callback
```

## 📋 Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Tag Manager API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Tag Manager API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/gtm/oauth/callback` (for local dev)
     - `https://your-domain.com/api/gtm/oauth/callback` (for production)
   - Copy the Client ID and Client Secret to your `.env` file

## 🗄️ Database Migration

Run the database migration to create GTM tables:

```bash
npm run db:migrate
```

Or manually run `migrations/001_initial_schema.sql` in your database.

## 🚀 Usage

### Connecting GTM Account

1. Navigate to **Usage Analytics** → **GTM Charts** tab
2. Click **"Connect GTM Account"** button
3. You'll be redirected to Google OAuth consent screen
4. Authorize the application
5. You'll be redirected back and GTM will be connected

### Syncing GTM Data

Once connected, you can:
- Click **"Refresh"** to fetch latest data from database
- Use **"Load Sample Data"** if GTM is not connected (for testing)
- The system will automatically refresh OAuth tokens when needed

### Disconnecting GTM Account

Click **"Disconnect GTM"** button to remove GTM credentials.

## 📊 Data Flow

1. **User connects GTM** → OAuth flow → Tokens stored in database
2. **User clicks Refresh** → Frontend calls API → Backend fetches from database
3. **User clicks Sync** → Backend calls GTM API → Updates database
4. **Token expires** → Automatic refresh → New token stored

## ⚠️ Important Notes

1. **Analytics Metrics**: GTM doesn't provide analytics data (page views, sessions, users, etc.). These metrics require **Google Analytics API** integration. Currently, sample data is used for these metrics.

2. **GTM-Specific Data**: The sync endpoint fetches real GTM data:
   - Container information
   - Tags count
   - Triggers count
   - Variables count

3. **Token Refresh**: Tokens are automatically refreshed:
   - When they expire or are about to expire (5 min buffer)
   - On 401 errors (with retry)
   - Tokens are stored securely in the database

## 🔐 Security

- OAuth tokens are stored in the database (encrypted in production)
- State parameter used to prevent CSRF attacks
- Tokens are scoped to project_id (multi-tenant support)
- Refresh tokens are used to get new access tokens without user interaction

## 📝 API Endpoints

- `GET /api/gtm/oauth/initiate` - Start OAuth flow
- `GET /api/gtm/oauth/callback` - OAuth callback handler
- `GET /api/gtm/credentials` - Get connection status
- `DELETE /api/gtm/credentials` - Disconnect GTM account
- `POST /api/gtm/sync` - Sync real GTM data
- `POST /api/gtm/seed-mock-data` - Seed sample data (for testing)
- `GET /api/gtm/analytics` - Get analytics data
- `GET /api/gtm/traffic-sources` - Get traffic sources
- `GET /api/gtm/page-views` - Get page views
- `GET /api/gtm/referrers` - Get referrers
- `GET /api/gtm/keywords` - Get keywords
- `GET /api/gtm/campaigns` - Get campaigns

## 🎯 Next Steps (Optional)

To get real analytics data (page views, sessions, etc.), you would need to:

1. Integrate Google Analytics API
2. Use the same OAuth flow (can reuse tokens if same Google account)
3. Fetch analytics data from GA API
4. Replace mock data in sync endpoint with real GA data

