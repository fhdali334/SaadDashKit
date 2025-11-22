# BigCommerce Integration Setup Guide

## ✅ Simple REST API Integration

BigCommerce integration uses the BigCommerce V3 REST API with access tokens, making setup straightforward.

---

## Step-by-Step Setup

### Step 1: Get BigCommerce API Credentials

1. Log in to your **BigCommerce Admin** dashboard
2. Navigate to **Settings** → **API Accounts** (under Advanced Settings)
3. Click **"Create API Account"**
4. Select **"Create V2/V3 API Token"**
5. Fill in the details:
   - **Name**: e.g., "Knowledge Base Integration"
   - **OAuth Scopes**: Set permissions based on your needs:
     - **Products**: `read-only` ✅ **REQUIRED** (must be enabled, not `None`)
     - **Store Inventory**: `read-only` ✅ **MAY BE REQUIRED** (try enabling this if you get 403 errors)
     - **Content**: `None` (not needed for product import)
     - **Customers**: `None` (not needed for product import)
     - **Orders**: `None` (not needed for product import)
     - **Order Transactions**: `None` (not needed)
     - **Information & Settings**: `None` (not needed)
     - **Marketing**: `None` (not needed)
     - **Checkout Content**: `None` (not needed)
     - **Customers Login**: `None` (not needed)
     - **Create Payments**: `None` (not needed)
     - **Get Payment Methods**: `None` (not needed)
     - **Stored Payment Instruments**: `None` (not needed)
6. Click **"Save"**
7. **Copy both**:
   - **Store Hash**: The part before `.mybigcommerce.com` in your store URL (e.g., `abc123` from `abc123.mybigcommerce.com`)
   - **Access Token**: The API access token shown (starts with various formats)

⚠️ **Important**: 
- Copy these immediately - the access token is only shown once! A text file will also download with all credentials.
- **Make sure Products scope is set to `read-only` or `modify`** - if it's set to `None`, you'll get a 403 error!

### Step 2: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click the **"BigCommerce"** card
3. Enter:
   - **Store Hash**: `abc123` (the part before .mybigcommerce.com)
   - **Access Token**: (paste the access token from Step 1)
4. Click **"Connect"**

That's it! Your BigCommerce store is now connected.

---

## Where to Find API Credentials

**Path**: BigCommerce Admin → Settings → API Accounts → Create API Account → Create V2/V3 API Token

**Store Hash**: Found in your store URL
- Example: If your store URL is `https://abc123.mybigcommerce.com`, your store hash is `abc123`

**Access Token**: Generated when you create the API token
- Shown only once when you create the token
- Also included in the downloaded credentials file

---

## API Permissions (OAuth Scopes)

For importing products into your knowledge base, you need:

- **Products**: `read-only` ✅ **Required** (minimum needed to fetch products)
  - **OAuth Scope Parameter**: `store_v2_products_read_only`
- **Store Inventory**: `read-only` ✅ **May be required** (some BigCommerce stores require this for Catalog API access)
  - **OAuth Scope Parameter**: `store_v2_inventory_read_only` (if needed)

**If you're getting 403 errors**, try enabling **Store Inventory** `read-only` scope as well. Some BigCommerce API endpoints require multiple scopes.

**All other scopes can be set to `None`** - you don't need them for product import.

### OAuth Scope Reference

| UI Name | Permission | OAuth Scope Parameter |
|---------|-----------|----------------------|
| Products | `read-only` | `store_v2_products_read_only` ✅ Required |
| Products | `modify` | `store_v2_products` (if you need write access) |
| Store Inventory | `read-only` | `store_v2_inventory_read_only` (may be required) |

### Why Only Products Read-Only?

- We're only **reading/fetching** products from BigCommerce
- We're not creating, updating, or deleting products via the API
- We're not accessing customer data, orders, or other resources
- `read-only` is the most secure option (principle of least privilege)

### If You Need More Later

If you plan to update products via the API in the future, you can:
- Change **Products** scope from `read-only` to `modify`
- Or create a new API token with `modify` permissions

---

## Benefits of BigCommerce REST API

✅ **Simple setup** - Just store hash and access token  
✅ **Direct access** - Connect directly to your BigCommerce store  
✅ **REST API** - Standard HTTP requests  
✅ **Product sync** - Import all BigCommerce products  
✅ **Automatic embeddings** - Products are vectorized for RAG search  

---

## Troubleshooting

### "BigCommerce API error (403): You don't have a required scope to access the endpoint"
- **This means your API token doesn't have the required scopes enabled OR you're using an old token**
- Go to BigCommerce Admin → Settings → API Accounts
- Click on your API account name (e.g., "test api") to view details
- Verify these scopes are enabled:
  - **Products**: `read-only` (OAuth scope: `store_v2_products_read_only`) ✅ **Required**
  - **Store Inventory**: `read-only` (OAuth scope: `store_v2_inventory_read_only`) ✅ **Try enabling this if you still get 403 errors**
- **Important**: If you changed scopes AFTER creating the token, you need to regenerate it:
  - Click **"Regenerate Token"** or **"View Token"** 
  - Copy the NEW access token (the old one won't work with new scopes)
  - Reconnect in the app with the new token
- If creating a new token: Make sure both **Products** and **Store Inventory** scopes are set to **`read-only`** BEFORE saving

### "BigCommerce API error (401): Unauthorized"
- Verify your Access Token is correct
- Check that the API token hasn't been revoked
- Ensure the API token has Products read permissions

### "BigCommerce API error (404): Not Found"
- Verify your Store Hash is correct (just the hash, not the full URL)
- Check that the store hash matches your store URL
- Ensure you're using the correct API version (V3)

### "Store hash is required"
- Make sure you entered the store hash (the part before .mybigcommerce.com)
- Example: For `abc123.mybigcommerce.com`, enter `abc123`

### "No products found"
- Verify products exist in BigCommerce
- Check that products are published (not draft)
- Ensure the API token has Products read permissions

### Products not loading
- Check server logs for API errors
- Verify network connectivity to BigCommerce API
- Review BigCommerce API account settings

---

## API Endpoint Used

The integration uses the BigCommerce V3 REST API endpoint:

**Example GET Request:**
```http
GET https://api.bigcommerce.com/stores/{{STORE_HASH}}/v3/catalog/products
X-Auth-Token: {{access_token}}
Accept: application/json
```

**Request Format:**
- **Method**: `GET`
- **URL**: `https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/products`
- **Headers**:
  - `X-Auth-Token`: Your BigCommerce API access token
  - `Accept`: `application/json`
- **Note**: `Content-Type` header is NOT needed for GET requests

**OAuth Scopes Required:**
- `store_v2_products_read_only` (Products read-only) ✅ Required
- `store_v2_inventory_read_only` (Store Inventory read-only) - May be required for some stores

**Response Format:**
BigCommerce V3 API returns data in this structure:
```json
{
  "data": [
    {
      "id": 123,
      "name": "Product Name",
      "description": "...",
      ...
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 250,
      "total": 100,
      "total_pages": 1
    }
  }
}
```

---

## Next Steps

After connecting:
- Products will be fetched using BigCommerce V3 REST API
- You can sync products to your knowledge base
- Imported products appear in the Manage Products tab
- Duplicate products are automatically skipped
- Products are automatically vectorized with embeddings for RAG search

---

## Product Import Details

- **Pagination**: Automatically handles multiple pages of products
- **Duplicate Detection**: Skips products that already exist
- **Embeddings**: Generates embeddings for RAG search automatically
- **Image URLs**: Uses standard or thumbnail image URLs
- **Product URLs**: Constructs full product URLs from custom URLs
- **Tags**: Combines brand name and categories into tags

