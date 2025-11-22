# Wix Integration Setup Guide

## ✅ OAuth 2.0 Integration

Wix integration uses the Wix eCommerce REST API with OAuth 2.0 access tokens. You'll need to create a Wix app and obtain an access token.

---

## Step-by-Step Setup

### Step 1: Create a Wix App

1. Go to [Wix Developer Dashboard](https://dev.wix.com/)
2. Click **"Create App"** or select an existing app
3. Fill in the app details:
   - **App Name**: e.g., "Knowledge Base Integration"
   - **App Type**: Select **"Headless"** or **"Wix App"**
4. Click **"Create"**

### Step 2: Configure OAuth Permissions

1. In your app dashboard, navigate to **"OAuth"** or **"Permissions"**
2. Request the following scopes:
   - ✅ **`stores.products.read`** - **REQUIRED** (to read products)
   - ✅ **`stores.inventory.read`** - **RECOMMENDED** (to read inventory)
   - ❌ **`stores.products.write`** - Not needed (leave unchecked)
   - ❌ **`stores.orders.read`** - Not needed (leave unchecked)
   - ❌ **`stores.orders.write`** - Not needed (leave unchecked)

⚠️ **Important**: Make sure **`stores.products.read`** permission is enabled - if it's not, you'll get a 403 error!

### Step 3: Get Your Site ID

1. Log in to your **Wix** site admin dashboard
2. Your **Site ID** can be found in:
   - Your site's URL: `https://www.wix.com/studio/editor/{SITE_ID}`
   - Or in the Wix Developer Dashboard → Your App → Test Sites
3. Copy the **Site ID** (it looks like: `abc123def456`)

### Step 4: Get OAuth Access Token

There are two ways to get an access token:

#### Option A: Using Wix Developer Dashboard (Recommended for Testing)

1. In your Wix Developer Dashboard, go to **"OAuth"** → **"Test Access Tokens"**
2. Select your test site
3. Click **"Generate Test Token"**
4. Copy the access token

#### Option B: Using OAuth Flow (For Production)

1. In your Wix Developer Dashboard, go to **"OAuth"**
2. Set up your **Redirect URI** (e.g., `https://yourdomain.com/auth/wix/callback`)
3. Generate an **Authorization URL**:
   ```
   https://www.wix.com/oauth/authorize?client_id={YOUR_APP_ID}&redirect_uri={YOUR_REDIRECT_URI}&scope=stores.products.read,stores.inventory.read
   ```
4. Visit the authorization URL and authorize your app
5. Exchange the authorization code for an access token using the OAuth token endpoint:
   ```
   POST https://www.wix.com/oauth/access
   ```
6. Copy the access token from the response

⚠️ **Important**: 
- Access tokens expire after a certain period (check Wix documentation for exact expiration time)
- You may need to refresh tokens periodically
- For production, implement token refresh logic

### Step 5: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click the **"Wix"** card
3. Enter:
   - **Site ID**: (paste the Site ID from Step 3)
   - **Access Token**: (paste the access token from Step 4)
4. Click **"Connect"**

That's it! Your Wix site is now connected.

---

## Where to Find Credentials

**Site ID**: 
- Found in your Wix site URL: `https://www.wix.com/studio/editor/{SITE_ID}`
- Or in Wix Developer Dashboard → Your App → Test Sites

**Access Token**:
- **Test Token**: Wix Developer Dashboard → OAuth → Test Access Tokens → Generate Test Token
- **Production Token**: Complete OAuth flow (see Step 4, Option B)

---

## API Permissions

For importing products into your knowledge base, you need:

- **`stores.products.read`** ✅ **REQUIRED** (must be enabled to access `/stores/v1/products`)
- **`stores.inventory.read`** ✅ **RECOMMENDED** (may be required for some product endpoints)

**If you're getting 403 errors**, try enabling **`stores.inventory.read`** permission as well. Some Wix API endpoints require multiple permissions.

**All other permissions can be left unchecked** - you don't need them for product import:
- ❌ `stores.products.write` (not needed - we're only reading)
- ❌ `stores.orders.read` (not needed)
- ❌ `stores.orders.write` (not needed)
- ❌ `stores.inventory.write` (not needed - we're only reading)

### Permission Reference

| Permission | Required? | Purpose |
|------------|-----------|---------|
| **`stores.products.read`** | ✅ **YES** | Access product data via `/stores/v1/products` |
| **`stores.inventory.read`** | ⚠️ **Maybe** | May be required for some product endpoints |
| `stores.products.write` | ❌ No | Not needed for import |
| `stores.orders.read` | ❌ No | Not needed for import |
| `stores.orders.write` | ❌ No | Not needed for import |
| `stores.inventory.write` | ❌ No | Not needed for import |

---

## Troubleshooting

### "Wix API error (403): Forbidden"

**Possible causes:**
1. **Missing permissions**: Make sure `stores.products.read` is enabled in your app's OAuth scopes
2. **Expired token**: Access tokens expire - generate a new test token or refresh your production token
3. **Wrong site ID**: Double-check that the Site ID matches the site you're trying to access
4. **Token not authorized**: Make sure the token was generated for the correct site

**Solutions:**
- Go to Wix Developer Dashboard → OAuth → Test Access Tokens
- Generate a new test token
- Reconnect in the app with the new token

### "Wix API error (404): Not Found"

**Possible causes:**
1. **Wrong Site ID**: The Site ID doesn't match any existing Wix site
2. **Wrong API endpoint**: The API endpoint might have changed (check Wix API documentation)

**Solutions:**
- Verify your Site ID is correct
- Check that your site has products enabled
- Ensure your Wix site is published and active

### "No products found in Wix store"

**Possible causes:**
1. **Empty store**: Your Wix store doesn't have any products yet
2. **API response structure**: The API response format might be different than expected (check server logs)
3. **Permissions issue**: The access token doesn't have the right permissions

**Solutions:**
- Check server logs for the actual API response structure
- Verify your store has products in the Wix admin dashboard
- Ensure `stores.products.read` permission is enabled

### "Wix API error (401): Unauthorized"

**Possible causes:**
1. **Invalid access token**: The token is expired or invalid
2. **Token not authorized**: The token wasn't generated for the correct site

**Solutions:**
- Generate a new access token from Wix Developer Dashboard
- Reconnect in the app with the new token

---

## API Endpoints Used

- **Get Products**: `GET https://www.wixapis.com/stores/v1/products`
- **Headers Required**:
  - `Authorization: Bearer {access_token}`
  - `wix-site-id: {site_id}`
  - `Content-Type: application/json`

---

## Additional Resources

- [Wix Developer Documentation](https://dev.wix.com/docs)
- [Wix eCommerce API Reference](https://dev.wix.com/docs/rest/api-reference/wix-stores)
- [Wix OAuth Guide](https://dev.wix.com/docs/rest/api-reference/authentication)
- [Wix Developer Dashboard](https://dev.wix.com/)

---

## Notes

- **Test Tokens**: Test access tokens are great for development but expire quickly. For production, implement proper OAuth flow with token refresh.
- **Rate Limits**: Wix APIs have rate limits. Check the documentation for current limits.
- **Pagination**: The integration automatically handles pagination to fetch all products.

