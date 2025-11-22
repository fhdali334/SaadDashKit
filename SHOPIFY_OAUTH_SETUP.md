# Complete Shopify OAuth Setup Guide

## ⚠️ Important: You MUST Enable Scopes in Shopify

The code **requests** scopes automatically, but Shopify **requires** you to **enable them first** in your app settings. Otherwise, OAuth will fail.

---

## Step-by-Step Setup

### Step 1: Create/Configure Your Shopify App

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Log in or create a Partner account
3. Click **"Apps"** in the left sidebar
4. Click **"Create app"** (or select an existing app)

### Step 2: Configure App Settings

#### A. Application URL
1. In your app settings, find **"App URL"** or **"Application URL"**
2. Set it to: `http://localhost:3000` (or your actual domain)
   - ⚠️ **Important**: The host must match your redirect URI host

#### B. Allowed redirection URL(s)
1. Find **"Allowed redirection URL(s)"** or **"Redirect URLs"**
2. Click **"Add URL"** or **"Configure"**
3. Add exactly: `http://localhost:3000/api/shopify/oauth/callback`
   - ⚠️ **Must match exactly** - including the `/api/shopify/oauth/callback` path
   - If using a different port (e.g., 5000), use: `http://localhost:5000/api/shopify/oauth/callback`

#### C. API Scopes (REQUIRED - Enable These!)
1. Find **"API Scopes"** or **"Scopes"** section
2. Under **"Admin API scopes"**, enable:
   - ✅ **`read_products`** - Read product information
   - ✅ **`read_product_listings`** - Read product listings
3. Click **"Save"**

### Step 3: Get Your API Credentials

1. In your app settings, find **"API credentials"** or **"Client credentials"**
2. Copy:
   - **API Key** (also called "Client ID")
   - **API Secret** (also called "Client Secret")
3. ⚠️ **Keep these secure** - don't share them publicly

### Step 4: Test the Integration

1. Start your server: `npm run dev`
2. Navigate to Knowledge Base → Add Products → API tab
3. Enter:
   - Shop Domain: `yourstore.myshopify.com`
   - API Key: (from Step 3)
   - API Secret: (from Step 3)
4. Click **"Connect"**
5. You'll be redirected to Shopify to authorize
6. After authorization, you'll be redirected back

---

## Common Issues & Solutions

### Error: "redirect_uri and application url must have matching hosts"
**Solution**: 
- Make sure Application URL host matches Redirect URI host
- Example: Both should use `localhost:3000` (not `localhost:3000` vs `127.0.0.1:3000`)

### Error: "Invalid scope"
**Solution**: 
- Go back to Step 2C and make sure both scopes are enabled
- Save the app settings
- Try again

### Error: "Invalid client_id"
**Solution**: 
- Double-check your API Key is correct
- Make sure you copied the full key (no extra spaces)

### 404 Error
**Solution**: 
- Check that your server is running on the correct port
- Verify the redirect URI matches exactly what's in Shopify settings

---

## For Production

When deploying to production:

1. Update **Application URL** to: `https://yourdomain.com`
2. Update **Redirect URI** to: `https://yourdomain.com/api/shopify/oauth/callback`
3. Make sure your domain has SSL (HTTPS)
4. Update environment variables if needed

---

## Quick Checklist

- [ ] Created Shopify app in Partner Dashboard
- [ ] Set Application URL: `http://localhost:3000`
- [ ] Set Redirect URI: `http://localhost:3000/api/shopify/oauth/callback`
- [ ] Enabled scope: `read_products`
- [ ] Enabled scope: `read_product_listings`
- [ ] Copied API Key
- [ ] Copied API Secret
- [ ] Saved all app settings
- [ ] Tested the connection

---

## Visual Guide Locations

In Shopify Partner Dashboard, look for these sections:
- **App setup** → **App URL**
- **App setup** → **Allowed redirection URL(s)**
- **Configuration** → **API Scopes** or **Scopes**
- **API credentials** → **API Key** and **API Secret**

