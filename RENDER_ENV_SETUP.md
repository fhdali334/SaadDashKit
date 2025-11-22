# Render Environment Variables Setup

## Quick Setup Checklist

Go to [Render Dashboard](https://dashboard.render.com/) → Your Service → **Environment** tab

### Required Variables (Copy & Paste)

Add these **exact** variable names and values:

```
GOOGLE_CLIENT_ID=737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com
```

```
GOOGLE_CLIENT_SECRET=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
```

```
GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
```

### Step-by-Step:

1. **Open Render Dashboard**: https://dashboard.render.com/
2. **Click on your service**: `saasdashkit-v1`
3. **Go to "Environment" tab** (left sidebar)
4. **Click "Add Environment Variable"** for each:

   **Variable 1:**
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh.apps.googleusercontent.com`
   - Click **"Save"**

   **Variable 2:**
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: `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`
   - Click **"Save"**

   **Variable 3:**
   - **Key**: `GOOGLE_REDIRECT_URI`
   - **Value**: `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback`
   - Click **"Save"**

5. **Render will automatically redeploy** your service
6. **Wait for deployment to complete** (check the "Events" tab)
7. **Test GTM connection** - Go to Usage Analytics → GTM Charts → Click "Connect GTM Account"

## Verify Variables Are Set

After adding, you should see all three variables listed in the Environment tab.

## Troubleshooting

### Still getting "GTM OAuth not configured" error?

1. ✅ Check that variables are spelled **exactly** as shown (case-sensitive)
2. ✅ Make sure you clicked **"Save"** after adding each variable
3. ✅ Wait for Render to finish redeploying (check Events tab)
4. ✅ Check Render logs for any errors during startup
5. ✅ Try refreshing your browser and logging in again

### Check Render Logs

1. Go to Render Dashboard → Your Service → **Logs** tab
2. Look for: `[GTM OAuth] OAuth2 Client Config:`
3. Should show: `hasClientId: true, hasClientSecret: true`

If you see `hasClientId: false` or `hasClientSecret: false`, the variables aren't set correctly.

