# Seed GTM Mock Data

## Quick Method: Browser Console (Easiest)

1. Go to https://saasdashkit-v1.onrender.com
2. **Login** with your project ID
3. Open **DevTools** (F12) → **Console** tab
4. Copy and paste this:

```javascript
fetch('/api/gtm/seed-mock-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('✅ GTM mock data seeded successfully!');
    console.log('Seeded:', data.seeded);
  } else {
    console.error('❌ Error:', data.error);
  }
})
.catch(err => console.error('❌ Error:', err));
```

5. Press **Enter**

## Alternative: Render Shell

1. Go to Render Dashboard → Your Service → **Shell**
2. Run:
```bash
node scripts/seed-gtm-mock-data.js 66aeff0ea380c590e96e8e70
```

## What Gets Seeded

- ✅ 30 days of analytics data (page views, sessions, users, clicks, conversions)
- ✅ 5 traffic sources
- ✅ 14 page views
- ✅ 7 referrers  
- ✅ 7 keywords
- ✅ 8 campaigns

