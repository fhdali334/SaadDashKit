# How to Check if Environment Variables are Set in Render

## Method 1: Check Startup Logs

1. Go to **Render Dashboard** → **Your Service** → **Logs** tab
2. Scroll to the **very beginning** of the logs (when the service started)
3. Look for this line:
   ```
   [Server Startup] Environment variables check: { ... }
   ```
4. Check if it shows:
   - `hasGoogleClientId: true` ✅
   - `hasGoogleClientSecret: true` ✅

If both are `false`, the variables are **NOT set** in Render Dashboard.

## Method 2: Use Diagnostic Endpoint (After Login)

1. Log into your app: `https://saasdashkit-v1.onrender.com`
2. Open browser console (F12)
3. Run this command:
   ```javascript
   fetch('/api/diagnostics/env', { credentials: 'include' }).then(r => r.json()).then(console.log)
   ```
4. Check the output - it will show which environment variables are detected

## Method 3: Verify in Render Dashboard

1. Go to **Render Dashboard** → **Your Service** → **Environment** tab
2. Scroll down and verify these three variables exist:
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `GOOGLE_REDIRECT_URI`
3. Check their values are correct (no extra spaces, correct values)

## If Variables Are Missing

1. Click **"+ Add Environment Variable"**
2. Add each variable:
   - **Key:** `GOOGLE_CLIENT_ID`
   - **Value:** `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com`
   - Click **"Save"**
   
   - **Key:** `GOOGLE_CLIENT_SECRET`
   - **Value:** `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`
   - Click **"Save"**
   
   - **Key:** `GOOGLE_REDIRECT_URI`
   - **Value:** `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback`
   - Click **"Save"**

3. **Wait for automatic redeploy** (or manually trigger: **Manual Deploy** → **Deploy latest commit**)

## After Adding Variables

1. Wait for deployment to complete
2. Check startup logs again - should show `hasGoogleClientId: true`
3. Try connecting GTM again

