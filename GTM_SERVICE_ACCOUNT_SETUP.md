# Google Tag Manager Service Account Setup (Alternative to OAuth)

## Why Use Service Account?

✅ **No OAuth consent screen needed** - No publishing required  
✅ **No user interaction** - Works automatically  
✅ **No token refresh** - Service accounts don't expire  
✅ **Simpler setup** - Just a JSON key file  

## Setup Steps

### 1. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Enter:
   - **Service account name**: `gtm-service-account`
   - **Description**: `Service account for GTM API access`
6. Click **CREATE AND CONTINUE**
7. Skip role assignment (click **CONTINUE**)
8. Click **DONE**

### 2. Create and Download JSON Key

1. Click on the service account you just created
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. **Save the downloaded JSON file securely** - you'll need it!

### 3. Enable Google Tag Manager API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Tag Manager API"**
3. Click on it
4. Click **ENABLE**

### 4. Grant Service Account Access to GTM

**Important**: The service account needs access to your GTM account/property.

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Select your GTM account
3. Click **Admin** (gear icon)
4. Go to **Container User Management** (or **Account User Management**)
5. Click **+** to add a user
6. Enter the service account email (found in the JSON file under `client_email`)
   - Format: `gtm-service-account@your-project-id.iam.gserviceaccount.com`
7. Grant permissions:
   - **View** - for readonly access
   - **Edit** - for edit.containers access
8. Click **INVITE**

### 5. Add JSON Key to Your App

**Option A: Environment Variable (Recommended)**

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. In Render Dashboard → Your Service → Environment tab
4. Add new variable:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON (as a single line, or use multiline)
5. Click **SAVE**

**Option B: Upload JSON File**

1. Upload the JSON file to a secure location
2. Set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` environment variable to the file path

## Environment Variables Needed

Add these to Render Dashboard:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

Or if using file path:

```
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json
```

## Code Changes Needed

The code needs to be updated to support service accounts. See `server/gtm-service-account.ts` (to be created) for the implementation.

## Comparison: OAuth vs Service Account

| Feature | OAuth 2.0 | Service Account |
|---------|-----------|-----------------|
| User consent | ✅ Required | ❌ Not needed |
| Publishing | ✅ Required | ❌ Not needed |
| Token refresh | ✅ Required | ❌ Not needed |
| User-specific | ✅ Yes | ❌ No (shared) |
| Setup complexity | ⚠️ Medium | ✅ Simple |
| Best for | Multi-user apps | Single account access |

## When to Use Each

**Use OAuth 2.0 when:**
- Each user needs to connect their own GTM account
- You want user-specific data
- Users should manage their own connections

**Use Service Account when:**
- You're accessing a single GTM account
- You want automatic, no-user-interaction access
- You're building a backend service
- You want to avoid OAuth consent screen issues

## Security Notes

⚠️ **Important**: 
- Keep the JSON key file secure
- Never commit it to git
- Use environment variables in production
- Rotate keys periodically
- Limit service account permissions to minimum needed

