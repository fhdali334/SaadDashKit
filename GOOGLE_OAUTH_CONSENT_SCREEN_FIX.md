# Fix Google OAuth "Access Blocked" Error

## Error Message
```
Access blocked: saasdashkit-v1.onrender.com has not completed the Google verification process
Error 403: access_denied
```

## Cause
Your Google OAuth app is in "Testing" mode, which means only approved test users can access it.

## Solution Options

### Option 1: Add Test Users (Quick Fix - Recommended for Development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with Client ID: `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh`)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add your email: `tristan.lac1944@gmail.com`
7. Click **ADD**
8. Click **SAVE**

**After adding yourself as a test user:**
- Try connecting GTM again
- The OAuth flow should work now

### Option 2: Publish Your App (For Production)

**⚠️ Warning:** Publishing requires Google verification if you're requesting sensitive scopes or making the app public.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Click **PUBLISH APP** button
5. Confirm the action

**Note:** If you're only using GTM scopes (which are not sensitive), publishing should work immediately. If you're requesting sensitive scopes, Google may require verification.

### Option 3: Check OAuth Consent Screen Configuration

Make sure your OAuth consent screen is properly configured:

1. Go to **OAuth consent screen**
2. Verify:
   - **App name**: Set (e.g., "SaaSDashKit")
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: Should include GTM scopes:
     - `https://www.googleapis.com/auth/tagmanager.readonly`
     - `https://www.googleapis.com/auth/tagmanager.edit.containers`
3. Click **SAVE AND CONTINUE**

## Current Status

Your app is in **Testing** mode, which means:
- ✅ Only test users can access it
- ✅ No Google verification required
- ❌ Limited to 100 test users
- ❌ Test users see a warning screen

## After Fixing

1. Try connecting GTM again from your app
2. You should be able to authorize the app
3. GTM data should start loading

## Troubleshooting

If you still get errors after adding yourself as a test user:
1. Make sure you're logged into Google with `tristan.lac1944@gmail.com`
2. Clear browser cache and cookies
3. Try in an incognito/private window
4. Check that the redirect URI matches exactly: `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback`

