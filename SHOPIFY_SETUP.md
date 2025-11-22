# Shopify Integration Setup Guide

## ⚠️ IMPORTANT: API Key Clarification

**Users do NOT need to provide API keys!** The OAuth flow handles everything automatically.

**However, YOU (the developer) need to create a Shopify app** and set up these environment variables:

- `SHOPIFY_API_KEY` - **YOUR app's** API key (from Shopify Partner Dashboard)
- `SHOPIFY_API_SECRET` - **YOUR app's** API secret (from Shopify Partner Dashboard)  
- `SHOPIFY_REDIRECT_URI` - OAuth callback URL (defaults to `http://localhost:3000/api/shopify/oauth/callback`)

**These are YOUR app credentials, NOT user credentials!** Users never see or provide these.

## How OAuth Works

1. **User clicks "Connect Shopify Store"** → Enters their shop domain (e.g., `snowshop27.myshopify.com`)
2. **System redirects to Shopify** → User authorizes YOUR app on Shopify's site
3. **Shopify redirects back** → With an authorization code
4. **System exchanges code for access token** → Stores it securely for that user's store
5. **User is authenticated** → No API key needed from the user!

**The user only needs to:**
- Enter their shop domain
- Click "Authorize" on Shopify's page
- Done! No API keys, no secrets, nothing to copy/paste.

## Setup Steps

### 1. Create Shopify App (One-Time Setup)

**This is a ONE-TIME setup for YOU (the developer), not for each user!**

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Create a new app (or use existing app)
3. Configure OAuth redirect URL: `http://localhost:3000/api/shopify/oauth/callback` (or your production URL)
4. Request scopes: `read_products`, `read_product_listings`
5. Copy your **API Key** and **API Secret** (these are YOUR app's credentials)
6. Add them to your `.env` file (see step 2)

**Note:** Once you set this up, ALL users can connect their stores without providing any API keys!

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_REDIRECT_URI=http://localhost:3000/api/shopify/oauth/callback
```

### 3. Test the Integration

1. Start your server: `npm run dev`
2. Navigate to Knowledge Base → Add Products tab
3. Enter shop domain: `snowshop27.myshopify.com`
4. Click "Connect Shopify Store"
5. Authorize on Shopify
6. You'll be redirected back and connected!

## Troubleshooting

### 404 Error on OAuth Initiate

If you get a 404 error when clicking "Connect Shopify Store":
- Check that the route `/api/shopify/oauth/initiate` exists in `server/routes.ts`
- Ensure you're logged in (authentication required)
- Check server logs for errors

### OAuth Callback Issues

- Ensure `SHOPIFY_REDIRECT_URI` matches exactly what's configured in Shopify Partner Dashboard
- Check that the redirect URI includes the full path: `/api/shopify/oauth/callback`

### Missing Environment Variables

If you see "SHOPIFY_API_KEY must be set" error:
- Add the environment variables to your `.env` file
- Restart the server after adding them

