# GTM OAuth Setup Instructions

Complete guide to set up Google Tag Manager OAuth integration.

**⚠️ Note: We're using Render for production. All environment variables should be set in Render Dashboard.**

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"** or select an existing project
4. Name your project (e.g., "SaaSDashKit GTM Integration")
5. Click **"Create"**

### 1.2 Enable Google Tag Manager API
1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Tag Manager API"**
3. Click on **"Google Tag Manager API"**
4. Click **"Enable"** button
5. Wait for the API to be enabled (usually takes a few seconds)

### 1.3 Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in:
     - **App name**: SaaSDashKit
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click **"Save and Continue"**
   - Add scopes (optional, can skip for now)
   - Add test users (optional, can skip for now)
   - Click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

5. Now create the OAuth client ID:
   - **Application type**: Select **"Web application"**
   - **Name**: SaaSDashKit GTM Integration
   - **Authorized redirect URIs**: Click **"+ ADD URI"** and add:
     ```
     https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
     ```
   - Click **"CREATE"**

6. **Copy your credentials**:
   - **Client ID**: Copy this (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret**: Click **"Show"** and copy this (looks like: `GOCSPX-xxxxxxxxxxxxx`)
   - **Keep these safe** - you'll need them in the next step

## Step 2: Configure Environment Variables

### 2.1 Local Development (.env file)

Add these to your `.env` file in the project root:

```env
# Google OAuth 2.0 Credentials for GTM Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
```

**Replace:**
- `your-client-id.apps.googleusercontent.com` with your actual Client ID
- `your-client-secret` with your actual Client Secret

### 2.2 Production (Render Dashboard)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service: **saasdashkit-v1**
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"** for each:

   **Variable 1:**
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Client ID (e.g., `123456789-abc.apps.googleusercontent.com`)

   **Variable 2:**
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Your Client Secret (e.g., `GOCSPX-xxxxxxxxxxxxx`)

   **Variable 3:**
   - **Key**: `GOOGLE_REDIRECT_URI`
   - **Value**: `https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback`

5. Click **"Save Changes"**
6. Render will automatically redeploy your service

## Step 3: Test the Integration

### 3.1 Verify Setup
1. Make sure your service is deployed on Render
2. Go to your app: https://saasdashkit-v1.onrender.com
3. **Login** with your project ID
4. Navigate to **Usage Analytics** → **GTM Charts** tab

### 3.2 Connect GTM Account
1. Click **"Connect GTM Account"** button
2. You should be redirected to Google OAuth consent screen
3. Select your Google account (the one with GTM access)
4. Click **"Allow"** to grant permissions
5. You'll be redirected back to your app
6. You should see: **"Connected to Account: [account-id] | Container: [container-id]"**

### 3.3 Verify Connection
- The **"Connect GTM Account"** button should be replaced with **"Disconnect GTM"**
- You should see GTM data (or empty if no data yet)
- Check Render logs for any errors

## Troubleshooting

### Error: "GTM OAuth not configured"
- ✅ Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Render environment variables
- ✅ Make sure you've saved the environment variables and the service has redeployed
- ✅ Check Render logs for detailed error messages

### Error: "redirect_uri_mismatch"
- ✅ Make sure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://saasdashkit-v1.onrender.com/api/gtm/oauth/callback
  ```
- ✅ Check for typos, trailing slashes, or http vs https
- ✅ The redirect URI must be added in **"Authorized redirect URIs"** section

### Error: "Invalid state"
- ✅ This usually means the session expired or was cleared
- ✅ Try connecting again - make sure you're logged in first
- ✅ Clear browser cookies and try again

### Error: "No GTM accounts found"
- ✅ Make sure you're using a Google account that has access to a GTM account
- ✅ Go to [tagmanager.google.com](https://tagmanager.google.com/) to verify you have GTM access
- ✅ Create a GTM account/container if you don't have one

### OAuth flow starts but callback fails
- ✅ Check Render logs for detailed error messages
- ✅ Verify the redirect URI matches exactly in Google Cloud Console
- ✅ Make sure the service has the latest code deployed

## Security Notes

- ✅ Never commit your `.env` file to git (it's already in `.gitignore`)
- ✅ Keep your Client Secret secure - don't share it publicly
- ✅ The redirect URI is validated by Google to prevent unauthorized redirects
- ✅ OAuth tokens are stored securely in the database

## Next Steps

Once connected:
- Use **"Sync GTM Data"** to fetch real GTM container data
- Use **"Load Sample Data"** if you want to see mock analytics data
- The system will automatically refresh OAuth tokens when they expire

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Make sure Google Tag Manager API is enabled in Google Cloud Console

