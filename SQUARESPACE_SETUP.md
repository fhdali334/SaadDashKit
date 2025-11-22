# Squarespace Integration Setup Guide

## ✅ Simple API Key Integration

Squarespace integration uses the Squarespace Commerce API with API keys, making setup straightforward.

---

## Step-by-Step Setup

### Step 1: Get Squarespace API Key

1. Log in to your **Squarespace** site admin dashboard
2. Navigate to **Settings** → **Advanced** → **Developer API Keys**
3. Click **"Generate Key"**
4. Fill in the details:
   - **Name**: e.g., "Knowledge Base Integration"
   - **Permissions**: Select the permissions you need:
     - ✅ **Read Products** - **REQUIRED** (must be enabled)
     - ✅ **Read Inventory** - **RECOMMENDED** (enable this to avoid 403 errors)
     - ❌ **Write Products** - Not needed (leave unchecked)
     - ❌ **Read Orders** - Not needed (leave unchecked)
     - ❌ **Write Orders** - Not needed (leave unchecked)
     - ❌ **Read Transactions** - Not needed (leave unchecked)
     - ❌ **Write Inventory** - Not needed (leave unchecked)
5. Click **"Generate"**
6. **Copy the API key** immediately - it's only shown once!

⚠️ **Important**: 
- Copy the API key immediately - it's only shown once!
- Make sure **Read Products** permission is enabled - if it's not, you'll get a 403 error!

### Step 2: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click the **"Squarespace"** card
3. Enter:
   - **Site URL**: `https://example.squarespace.com` (your Squarespace site URL)
   - **API Key**: (paste the API key from Step 1)
4. Click **"Connect"**

That's it! Your Squarespace site is now connected.

---

## Where to Find API Credentials

**Path**: Squarespace Admin → Settings → Advanced → Developer API Keys → Generate Key

**Site URL**: Your Squarespace site URL
- Example: `https://example.squarespace.com`
- Or: `https://example.com` (if using a custom domain)

**API Key**: Generated when you create the API key
- Shown only once when you generate the key
- Copy it immediately!

---

## API Permissions

For importing products into your knowledge base, you need:

- **Read Products** ✅ **REQUIRED** (must be enabled to access `/commerce/products`)
- **Read Inventory** ✅ **May be required** (some Squarespace sites require this for product access)

**If you're getting 403 errors**, try enabling **Read Inventory** permission as well. Some Squarespace API endpoints require multiple permissions.

**All other permissions can be left unchecked** - you don't need them for product import:
- ❌ Write Products (not needed - we're only reading)
- ❌ Read Orders (not needed)
- ❌ Write Orders (not needed)
- ❌ Read Transactions (not needed)
- ❌ Write Inventory (not needed - we're only reading)

### Permission Reference

| Permission | Required? | Purpose |
|------------|-----------|---------|
| **Read Products** | ✅ **YES** | Access product data via `/commerce/products` |
| **Read Inventory** | ⚠️ **Maybe** | May be required for some product endpoints |
| Write Products | ❌ No | Not needed for import |
| Read Orders | ❌ No | Not needed for import |
| Write Orders | ❌ No | Not needed for import |
| Read Transactions | ❌ No | Not needed for import |
| Write Inventory | ❌ No | Not needed for import |

### Why Only Read Permissions?

- We're only **reading/fetching** products from Squarespace
- We're not creating, updating, or deleting products via the API
- We're not accessing customer data, orders, or other resources
- Read permissions are the most secure option (principle of least privilege)

---

## Benefits of Squarespace Commerce API

✅ **Simple setup** - Just site URL and API key  
✅ **Direct access** - Connect directly to your Squarespace site  
✅ **REST API** - Standard HTTP requests  
✅ **Product sync** - Import all Squarespace products  
✅ **Automatic embeddings** - Products are vectorized for RAG search  

---

## Troubleshooting

### "Squarespace API error (403): Forbidden"
- **This means your API key doesn't have the required permissions OR you're using an invalid key**
- Go to Squarespace Admin → Settings → Advanced → Developer API Keys
- Click on your API key name to view details
- Verify these permissions are enabled:
  - **Read Products** ✅ **Required**
  - **Read Inventory** ✅ **Try enabling this if you still get 403 errors**
- **Important**: If you changed permissions AFTER generating the key, you may need to regenerate it:
  - Delete the old key
  - Generate a new key with the correct permissions
  - Reconnect in the app with the new key

### "Squarespace API error (401): Unauthorized"
- Verify your API Key is correct
- Check that the API key hasn't been revoked
- Ensure the API key has Read Products permissions

### "Squarespace API error (404): Not Found"
- Verify your Site URL is correct
- Check that the site URL matches your Squarespace site
- Ensure you're using the correct format (https://example.squarespace.com or https://example.com)

### "Site URL is required" or "API key is required"
- Make sure you entered both the Site URL and API Key
- Check that the fields are not empty

### "No products found"
- Verify products exist in Squarespace
- Check that products are published (not draft)
- Ensure the API key has Read Products permissions

### Products not loading
- Check server logs for API errors
- Verify network connectivity to Squarespace API
- Review Squarespace API key settings

---

## API Endpoint Used

The integration uses the Squarespace Commerce API endpoint:

**Example GET Request:**
```http
GET https://api.squarespace.com/1.0/commerce/products
Authorization: Bearer {api_key}
User-Agent: SaaSDashKit/1.0
Accept: application/json
```

**Request Format:**
- **Method**: `GET`
- **URL**: `https://api.squarespace.com/1.0/commerce/products`
- **Headers**:
  - `Authorization`: `Bearer {your_api_key}`
  - `User-Agent`: `SaaSDashKit/1.0`
  - `Accept`: `application/json`

**Response Format:**
Squarespace API returns data in this structure:
```json
{
  "result": [
    {
      "id": "abc123",
      "name": "Product Name",
      "description": "...",
      "url": "/products/product-name",
      ...
    }
  ],
  "pagination": {
    "hasNextPage": true,
    "nextPageCursor": "a637d2e4f3c5437fb384b9de5930d705",
    "nextPageUrl": "https://api.squarespace.com/1.0/commerce/products?cursor=..."
  }
}
```

**Note**: The pagination uses `nextPageCursor` (not `cursor`) to identify the next page of results.

---

## Next Steps

After connecting:
- Products will be fetched using Squarespace Commerce API
- You can sync products to your knowledge base
- Imported products appear in the Manage Products tab
- Duplicate products are automatically skipped
- Products are automatically vectorized with embeddings for RAG search

---

## Product Import Details

- **Pagination**: Automatically handles cursor-based pagination
- **Duplicate Detection**: Skips products that already exist
- **Embeddings**: Generates embeddings for RAG search automatically
- **Image URLs**: Uses thumbnail or first image URL
- **Product URLs**: Constructs full product URLs from relative URLs
- **Tags**: Combines tags and categories into tags string

