# How to Publish Your Google OAuth App

## What This Does
Publishing your OAuth app makes it available to all users, not just test users. This removes the "Access blocked" error.

## Steps to Publish

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project (the one with Client ID: `737172325695-qkkluvdulbkg06pa10n8b053rb2ddtuh`)

### 2. Navigate to OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**

### 3. Verify Your App Information
Make sure these are filled out:
- **App name**: Your app name (e.g., "SaaSDashKit")
- **User support email**: Your email (`tristan.lac1944@gmail.com`)
- **Developer contact information**: Your email
- **App domain** (optional): `saasdashkit-v1.onrender.com`
- **Authorized domains**: Add `onrender.com` if needed

### 4. Verify Scopes Are Added
Scroll to **Scopes** section and ensure these are added:
- `https://www.googleapis.com/auth/tagmanager.readonly`
- `https://www.googleapis.com/auth/tagmanager.edit.containers`

If not added:
- Click **ADD OR REMOVE SCOPES**
- Search for and add the scopes above
- Click **UPDATE**

### 5. Publish the App
1. Scroll to the bottom of the OAuth consent screen page
2. Look for the **"Publishing status"** section
3. You should see: **"App is in testing"** with a **PUBLISH APP** button
4. Click **PUBLISH APP**
5. Confirm the action

### 6. After Publishing
- Your app status will change from "Testing" to "In production"
- All users can now access your app (no test user list needed)
- The "Access blocked" error should disappear

## Important Notes

### For GTM Scopes (Your Case)
✅ **Good news**: The GTM scopes you're using are **NOT sensitive scopes**
- `tagmanager.readonly` - Not sensitive
- `tagmanager.edit.containers` - Not sensitive

This means:
- ✅ You can publish immediately without Google verification
- ✅ No additional review process required
- ✅ Works for all users right away

### If You Were Using Sensitive Scopes
If you were using sensitive scopes (like accessing user's email, profile, etc.), you would need:
- Google verification process
- Privacy policy URL
- Terms of service URL
- Screenshots of your app
- Video demonstration

But since you're only using GTM scopes, **none of this is required**.

## Troubleshooting

### "PUBLISH APP" Button Not Visible
- Make sure all required fields are filled (App name, User support email)
- Check that you're the owner of the project
- Try refreshing the page

### Still Getting "Access Blocked" After Publishing
- Wait a few minutes for changes to propagate
- Clear browser cache and cookies
- Try in an incognito/private window
- Make sure you're logged in with the correct Google account

### Want to Keep It in Testing Mode?
If you prefer to keep it in testing mode (limited to 100 test users):
- Don't click PUBLISH APP
- Instead, add test users in the **Test users** section
- Add: `tristan.lac1944@gmail.com`

## Quick Summary

**To publish**: OAuth consent screen → Scroll down → Click **PUBLISH APP** → Confirm

That's it! No terminal commands needed - it's all done in the Google Cloud Console web UI.

