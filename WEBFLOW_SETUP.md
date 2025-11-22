# Webflow Integration Setup Guide

## ✅ API Token Integration

Webflow integration uses the Webflow CMS API with API tokens, making setup straightforward.

---

## Step-by-Step Setup

### Step 1: Get Your Webflow Site ID

1. Log in to your **Webflow** account
2. Open your project in the Webflow Designer
3. Click **Settings** (gear icon) in the left sidebar
4. Go to **General** tab
5. Your **Site ID** is displayed at the top (it looks like: `abc123def456`)
6. Copy the Site ID

Alternatively, you can find it in your site's URL when viewing the site in the Designer.

### Step 2: Generate API Access Token

1. In your Webflow project, go to **Project Settings**
2. Navigate to **API Access** section
3. Click **"Generate API Token"** or **"Create Token"**
4. Give your token a name (e.g., "Knowledge Base Integration")
5. Select the permissions you need:
   - ✅ **`ecommerce:read`** - **REQUIRED** (to read products via Ecommerce API)
   - ✅ **`sites:read`** - **RECOMMENDED** (to read site information)
   - ❌ **`ecommerce:write`** - Not needed (leave unchecked - we're only reading)
   - ❌ **`cms:read`** - Not needed (we use Ecommerce API, not CMS)
   - ❌ **`cms:write`** - Not needed (leave unchecked)
   - ❌ **`sites:write`** - Not needed (leave unchecked)
6. Click **"Generate"** or **"Create"**
7. **Copy the API token immediately** - it's only shown once!

⚠️ **Important**: 
- Copy the API token immediately - it's only shown once!
- Make sure **`ecommerce:read`** permission is enabled - if it's not, you'll get a 403 error!
- The integration uses the **Ecommerce Products API**, not CMS collections, so you need `ecommerce:read` scope

### Step 3: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click the **"Webflow"** card
3. Enter:
   - **Site ID**: (paste the Site ID from Step 1)
   - **Access Token**: (paste the API token from Step 2)
4. Click **"Connect"**

That's it! Your Webflow site is now connected.

---

## Where to Find Credentials

**Site ID**: 
- Webflow Designer → Settings → General tab
- Or in your site's URL when viewing in Designer

**Access Token**:
- Webflow → Project Settings → API Access → Generate Token

---

## API Permissions (Scopes)

For importing products into your knowledge base, you need:

- **`ecommerce:read`** ✅ **REQUIRED** (must be enabled to access products via Ecommerce API)
- **`sites:read`** ✅ **RECOMMENDED** (may be required for some site operations)

**If you're getting 403 errors**, make sure **`ecommerce:read`** permission is enabled.

**All other permissions can be left unchecked** - you don't need them for product import:
- ❌ `ecommerce:write` (not needed - we're only reading)
- ❌ `cms:read` (not needed - we use Ecommerce API, not CMS)
- ❌ `cms:write` (not needed)
- ❌ `sites:write` (not needed)

### Permission Reference

| Scope | Required? | Purpose |
|-------|-----------|---------|
| **`ecommerce:read`** | ✅ **YES** | Access products via Ecommerce Products API (`/v2/sites/:site_id/products`) |
| **`sites:read`** | ⚠️ **Maybe** | May be required for some site operations |
| `ecommerce:write` | ❌ No | Not needed for import |
| `cms:read` | ❌ No | Not needed (we use Ecommerce API, not CMS collections) |
| `cms:write` | ❌ No | Not needed for import |
| `sites:write` | ❌ No | Not needed for import |

---

## How It Works

Webflow uses the **Ecommerce Products API** to access products. The integration:

1. **Fetches products** directly from the Ecommerce API (`/v2/sites/:site_id/products`)
2. **Handles pagination** automatically to get all products
3. **Maps product data** from `fieldData` to our product schema:
   - `fieldData.name` → Product name
   - `fieldData.description` → Product description
   - `fieldData.main-image` → Product image (or from first SKU if not available)
   - `fieldData.slug` → Product URL
   - `fieldData.tax-category` and `fieldData.ec-product-type` → Product tags

---

## Troubleshooting

### "Webflow API error (403): Forbidden"

**Possible causes:**
1. **Missing permissions**: Make sure **Read CMS** is enabled in your API token
2. **Invalid token**: The token might be expired or revoked
3. **Wrong site ID**: The Site ID doesn't match the site you're trying to access

**Solutions:**
- Go to Webflow → Project Settings → API Access
- Verify **Read CMS** permission is enabled
- Generate a new token if needed
- Reconnect in the app with the new token

### "Webflow API error (404): Not Found"

**Possible causes:**
1. **Wrong Site ID**: The Site ID doesn't match any existing Webflow site
2. **Wrong API endpoint**: The API endpoint might have changed (check Webflow API documentation)

**Solutions:**
- Verify your Site ID is correct (check in Project Settings → General)
- Ensure your Webflow site is published and active

### "No products found in Webflow site"

**Possible causes:**
1. **No products in Ecommerce**: Your Webflow site doesn't have any products set up in Ecommerce
2. **Wrong API scope**: The token doesn't have `ecommerce:read` permission
3. **API response structure**: The API response format might be different than expected (check server logs)

**Solutions:**
- Check server logs for the actual API response structure
- Verify your Webflow site has products set up in the Ecommerce section
- Ensure your API token has `ecommerce:read` scope enabled
- Make sure products are published (not just drafts)

### "Webflow API error (401): Unauthorized"

**Possible causes:**
1. **Invalid access token**: The token is expired or invalid
2. **Token not authorized**: The token wasn't generated for the correct site

**Solutions:**
- Generate a new access token from Webflow Project Settings
- Reconnect in the app with the new token
- Verify the token has **Read CMS** permission

---

## API Endpoints Used

- **List Products**: `GET https://api.webflow.com/v2/sites/{site_id}/products?offset={offset}&limit={limit}`
- **Headers Required**:
  - `Authorization: Bearer {access_token}`
  - `accept-version: 1.0.0`
  - `Content-Type: application/json`
- **Required Scope**: `ecommerce:read`

---

## Field Mapping

The integration automatically maps Webflow Ecommerce product fields to product fields:

| Webflow Field (from `fieldData`) | Product Field |
|----------------------------------|---------------|
| `name` | Name |
| `description` | Description |
| `main-image` (from product or first SKU) | Image URL |
| `slug` | Product URL |
| `tax-category`, `ec-product-type` | Tags |

Products are fetched directly from the Ecommerce API, so field names are standardized.

---

## Additional Resources

- [Webflow API Documentation](https://developers.webflow.com/)
- [Webflow CMS API Reference](https://developers.webflow.com/reference/cms)
- [Webflow API Authentication](https://developers.webflow.com/reference/authentication)

---

## Notes

- **Ecommerce API**: The integration uses Webflow's Ecommerce Products API, not CMS collections. Make sure your products are set up in the Ecommerce section of your Webflow site.
- **Pagination**: The integration automatically handles pagination to fetch all products.
- **SKUs**: Products can have multiple SKUs. The integration uses the product's main image, or falls back to the first SKU's image if available.
- **Published Products**: Only published products are imported (draft products are excluded).

