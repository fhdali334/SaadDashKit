# Shopify Storefront API Setup Guide

## ✅ No OAuth Required!

The Storefront API uses access tokens instead of OAuth, making setup much simpler.

---

## Step-by-Step Setup

### Step 1: Get Your Storefront API Access Token

1. Log in to your **Shopify Admin** (not Partner Dashboard)
2. Go to **Settings** → **Apps and sales channels**
3. Click **"Develop apps"** (or "Manage private apps" in older versions)
4. Click **"Create an app"** or select an existing app
5. Name your app (e.g., "Knowledge Base Integration")
6. Click **"Configure Admin API scopes"** or go to **"API credentials"** tab
7. Find **"Storefront API"** section
8. Click **"Configure"** or **"Enable"**
9. Copy the **"Storefront API access token"**
   - **Public token**: For client-side (starts with `shpat_` or `shpca_`)
   - **Private token**: For server-side (recommended, also starts with `shpat_` or `shpca_`)
   - Both work, but private token is more secure for server-side use

### Step 2: Connect in Your App

1. Navigate to **Knowledge Base** → **Add Products** → **API** tab
2. Click **"Connect Shopify Store"**
3. Enter:
   - **Shop Domain**: `yourstore.myshopify.com`
   - **Storefront API Access Token**: (paste the token from Step 1)
4. Click **"Connect"**

That's it! No OAuth, no redirects, no scopes to configure.

---

## Where to Find Storefront Access Token

**Path**: Shopify Admin → Settings → Apps and sales channels → Develop apps → Your App → API credentials → Storefront API access token

**Alternative Path** (older Shopify versions):
- Settings → Apps → Manage private apps → Your App → Storefront API access token

---

## Token Types & Scopes

### Storefront API Access Tokens

The Storefront API uses **access tokens** (not scopes like Admin API). There are two types:

1. **Public Access Token** (`publicAccessToken`)
   - For **client-side** applications (browsers, mobile apps)
   - Uses header: `X-Shopify-Storefront-Access-Token`
   - Can be exposed in frontend code (read-only)
   - Access to: products, collections, search, cart operations

2. **Private Access Token** (`privateAccessToken`)
   - For **server-side** applications (recommended for this integration)
   - Uses header: `Shopify-Storefront-Private-Token`
   - Must be kept secret (never expose to client)
   - Access to: all Storefront API features including product tags, metaobjects, metafields, customer data

### Scopes

**The Storefront API does NOT use scopes** like the Admin API. Instead:
- **Tokenless access**: Basic features without a token (products, collections, search)
- **Token-based access**: Full features with an access token (tags, metaobjects, metafields, customer data)

### Which Token to Use?

**For this integration (server-side)**: Use **Private Access Token** (`privateAccessToken`)
- More secure (never exposed to client)
- Full API access
- Recommended for server-to-server requests

**Current Implementation**: The code uses `publicAccessToken` but makes server-side requests. Consider switching to `privateAccessToken` for better security.

---

## Benefits of Storefront API

✅ **No OAuth flow** - Just enter token and connect  
✅ **No redirect URIs** - No configuration needed  
✅ **No scopes** - Access token handles permissions  
✅ **GraphQL API** - More flexible queries  
✅ **Simpler setup** - One token, done!

---

## Troubleshooting

### "Invalid access token"
- Make sure you copied the full token (no spaces)
- Verify the token is from Storefront API, not Admin API
- Check that the app has Storefront API enabled

### "Storefront API access token not found"
- Make sure you entered the token in the form
- Check that credentials were saved successfully

### Products not loading
- Verify the token has read permissions
- Check that products are published in your store
- Review server logs for API errors

---

## Next Steps

After connecting:
- Products will be fetched using GraphQL queries
- You can sync products to your knowledge base
- Search and filter products using Storefront API

