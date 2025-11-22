# Render Environment Variables - Complete List

**Render doesn't use `.env` files** - set these in Render Dashboard → Your Service → Environment tab

## Required Environment Variables

Copy and paste these into Render Dashboard:

### 1. Database Connection
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```
*(Replace with your actual PostgreSQL connection string from Render or Neon)*

### 2. Session Secret
```
SESSION_SECRET=your-production-secret-here
```
*(Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

### 3. Node Environment
```
NODE_ENV=production
```

### 4. OpenAI API Key
```
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

## Optional but Recommended

### 5. Google OAuth for GTM Integration
```
GOOGLE_CLIENT_ID=737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
```

### 6. Voiceflow API Key (Optional - can also be set in UI)
```
VOICEFLOW_API_KEY=VF.DM.your-voiceflow-api-key-here
```

### 7. Stripe Keys (Optional - for payments)
```
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## Quick Copy-Paste for Render Dashboard

**Step 1:** Go to https://dashboard.render.com/ → Your Service → **Environment** tab

**Step 2:** Add each variable one by one:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://...` (your database URL) |
| `SESSION_SECRET` | `[generate random 64-char hex string]` |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | `sk-proj-...` |
| `GOOGLE_CLIENT_ID` | `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `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` |
| `GOOGLE_REDIRECT_URI` | `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback` |

**Step 3:** Click **"Save Changes"** - Render will automatically redeploy

## How to Add Variables in Render

1. Click **"+ Add Environment Variable"** button
2. Enter the **Key** (exact name from table above)
3. Enter the **Value** (copy from table above)
4. Click **"Save"**
5. Repeat for each variable
6. After adding all, Render will redeploy automatically

## Verify Variables Are Set

After adding, scroll down in the Environment tab - you should see all variables listed.

## Important Notes

- ✅ Variable names are **case-sensitive** - use exact names shown
- ✅ No quotes needed around values
- ✅ Render automatically redeploys when you save environment variables
- ✅ Check Render logs after deployment to verify variables are loaded
- ✅ `.env` file is only for local development - Render uses Dashboard environment variables

