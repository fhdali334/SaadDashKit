# Environment Variables Guide

## Render Production (Environment Variables) - PRIMARY SETUP

**We're using Render for production.** Set these in Render Dashboard → Your Service → Environment:

### Required in Production

```env
# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Session Secret (generate a secure random string)
SESSION_SECRET=your-production-secret-here

# OpenAI API Key
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Node Environment
NODE_ENV=production

# Node Version (already in render.yaml)
NODE_VERSION=20.17.0
```

### Optional but Recommended in Production

```env
# Voiceflow API Key (can also be set in UI Settings)
VOICEFLOW_API_KEY=VF.DM.your-voiceflow-api-key

# Google OAuth 2.0 Credentials for GTM Integration
GOOGLE_CLIENT_ID=737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
# Note: GOOGLE_REDIRECT_URI is optional - will auto-detect if not set
```

---

## Local Development (.env file) - FOR TESTING ONLY

**Note:** For local development/testing, create a `.env` file in the project root:

### Required for Local Development

```env
# Session Secret
SESSION_SECRET=dev-only-secret-change-in-production-12345

# OpenAI API Key (for AI Analysis feature)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Server Port (optional, defaults to 5000)
PORT=3000

# Environment (optional, defaults to development)
NODE_ENV=development
```

### Optional for Local Development

```env
# Voiceflow API Key (can also be set in UI)
# If not set here, you can enter it during login or in Settings page
VOICEFLOW_API_KEY=VF.DM.your-voiceflow-api-key-here

# Google OAuth 2.0 Credentials for GTM Integration (use same as Render)
GOOGLE_CLIENT_ID=737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
```

**Note:** `DATABASE_URL` is NOT required locally. The app uses in-memory storage for local development.

---

## Differences: Local vs Production

| Variable | Local | Production | Notes |
|----------|-------|------------|-------|
| `DATABASE_URL` | ❌ Not needed | ✅ Required | Local uses in-memory storage |
| `SESSION_SECRET` | ✅ Required | ✅ Required | Use strong secret in production |
| `OPENAI_API_KEY` | ✅ Required | ✅ Required | For AI Analysis feature |
| `VOICEFLOW_API_KEY` | ⚠️ Optional | ⚠️ Optional | Can be set in UI instead |
| `GOOGLE_CLIENT_ID` | ⚠️ Optional | ⚠️ Optional | Required for GTM OAuth integration |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Optional | ⚠️ Optional | Required for GTM OAuth integration |
| `GOOGLE_REDIRECT_URI` | ⚠️ Optional | ⚠️ Optional | Auto-detected if not set |
| `PORT` | ⚠️ Optional | ❌ Not needed | Render sets this automatically |
| `NODE_ENV` | ⚠️ Optional | ✅ Required | Set to "production" in Render |

---

## Quick Setup

### Render Production (PRIMARY) ⭐

1. Go to [Render Dashboard](https://dashboard.render.com/) → Your Service → **Environment** tab
2. Add each required variable:
   - `DATABASE_URL` - Your PostgreSQL connection string (format: `postgresql://user:pass@host:port/db?sslmode=require`)
   - `SESSION_SECRET` - Generate with: `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NODE_ENV` - Set to `production`
   - `GOOGLE_CLIENT_ID` - `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` - `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`
   - `GOOGLE_REDIRECT_URI` - `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback`
3. Click **"Save Changes"** - Render will automatically redeploy
4. Your app is live at: https://saasdashkit-v1.onrender.com

### Local Development (FOR TESTING ONLY)

1. Create `.env` file in project root:
   ```bash
   # Windows PowerShell
   New-Item .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   SESSION_SECRET=dev-only-secret-change-in-production-12345
   OPENAI_API_KEY=sk-proj-your-key
   GOOGLE_CLIENT_ID=737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

---

## Generating Secrets

### Session Secret

**macOS/Linux:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

---

## Troubleshooting

### "Missing environment variable" errors

- ✅ Check `.env` file exists in project root
- ✅ Restart the server after creating/editing `.env`
- ✅ Check variable names match exactly (case-sensitive)
- ✅ In Render, verify variables are set in Dashboard → Environment

### Login doesn't work

- ✅ Check `SESSION_SECRET` is set
- ✅ Clear browser cookies
- ✅ Check server logs for session errors

### Database errors (Production only)

- ✅ Verify `DATABASE_URL` is set correctly
- ✅ Check database tables are created (run `npm run db:migrate`)
- ✅ Verify database allows connections from Render's IPs

### API features don't work

- ✅ Check `OPENAI_API_KEY` is set (for AI Analysis)
- ✅ Check `VOICEFLOW_API_KEY` is set (for Voiceflow API features)
- ✅ Keys can also be set in UI Settings page

