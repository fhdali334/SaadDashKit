# WordPress/WooCommerce Integration Setup Guide

## ✅ Simple REST API Integration

WordPress/WooCommerce integration uses the WooCommerce REST API, which requires API keys (Consumer Key and Secret).

---

## Step-by-Step Setup

### Step 1: Get WooCommerce API Credentials

1. Log in to your **WordPress Admin** dashboard
2. Go to **WooCommerce** → **Settings** → **Advanced** → **REST API**
3. Click **"Add key"** or **"Create an API key"**
4. Fill in the details:
   - **Description**: e.g., "Knowledge Base Integration"
   - **User**: Select a user with appropriate permissions (usually Administrator)
   - **Permissions**: Select **"Read"** (or "Read/Write" if you plan to update products)
5. Click **"Generate API key"**
6. **Copy both**:
   - **Consumer Key** (starts with `ck_`)
   - **Consumer Secret** (starts with `cs_`)

⚠️ **Important**: Copy these immediately - the Consumer Secret is only shown once!

### Step 2: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click the **"WordPress"** card
3. Enter:
   - **Site URL**: `https://your-site.com` (your WordPress site URL)
   - **Consumer Key**: (paste the key from Step 1)
   - **Consumer Secret**: (paste the secret from Step 1)
4. Click **"Connect"**

That's it! Your WordPress site is now connected.

---

## Where to Find API Credentials

**Path**: WordPress Admin → WooCommerce → Settings → Advanced → REST API → Add key

**Alternative Path** (older WooCommerce versions):
- WooCommerce → Settings → API → Keys/Apps → Add key

---

## API Permissions

- **Read**: Allows fetching products (recommended for import)
- **Read/Write**: Allows fetching and updating products
- **Write**: Allows updating products only

For importing products into your knowledge base, **Read** permission is sufficient.

---

## Benefits of WooCommerce REST API

✅ **Simple setup** - Just API keys, no OAuth  
✅ **Direct access** - Connect directly to your WordPress site  
✅ **REST API** - Standard HTTP requests  
✅ **Product sync** - Import all WooCommerce products  

---

## Troubleshooting

### "WordPress API error (401): Unauthorized"
- Verify your Consumer Key and Secret are correct
- Check that the API key hasn't been revoked
- Ensure the API key has Read permissions

### "WordPress API error (404): Not Found"
- Verify your Site URL is correct (include `https://`)
- Check that WooCommerce is installed and activated
- Ensure the REST API is enabled in WooCommerce settings

### "No products found"
- Verify products exist in WooCommerce
- Check that products are published (not draft)
- Ensure the API key has Read permissions

### Products not loading
- Check server logs for API errors
- Verify network connectivity to your WordPress site
- Review WooCommerce REST API settings

---

## Next Steps

After connecting:
- Products will be fetched using WooCommerce REST API
- You can sync products to your knowledge base
- Imported products appear in the Manage Products tab
- Duplicate products are automatically skipped

---

## API Endpoint Used

The integration uses the WooCommerce REST API endpoint:
```
GET https://your-site.com/wp-json/wc/v3/products
```

With Basic Authentication using Consumer Key and Secret.

