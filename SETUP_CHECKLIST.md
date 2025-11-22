# Setup Checklist & Verification

## ✅ Current Configuration Status

### Environment Variables (.env)
- ✅ `SESSION_SECRET` - Present
- ✅ `OPENAI_API_KEY` - Present  
- ✅ `PORT` - Set to 3000
- ✅ `NODE_ENV` - Set to development
- ⚠️ `VOICEFLOW_API_KEY` - Optional (can be set in UI)

### Code Fixes Applied
- ✅ `cross-env` installed for Windows compatibility
- ✅ `dotenv` installed and configured
- ✅ `credentials: "include"` added to all auth fetch calls
- ✅ Session cookie configuration fixed
- ✅ Debug logging added

## Testing Steps

### 1. Verify Server Starts
```powershell
npm run dev
```
**Expected:** Server starts on port 3000 without errors

### 2. Test Login Flow

1. **Open browser** to `http://localhost:3000`
2. **Open DevTools** (F12) → **Console** tab
3. **Enter Project ID** (e.g., `66aeff0ea380c590e96e8e70`)
4. **Click "Access Dashboard"**
5. **Check Console** for any errors
6. **Check Network tab** → Look for `/api/auth/login` request:
   - Status should be `200`
   - Request should have `Cookie` header
   - Response should have `Set-Cookie` header

### 3. Verify Session Cookie

**In DevTools → Application → Cookies:**
- Should see cookie named `connect.sid`
- Domain: `localhost`
- Path: `/`
- HttpOnly: ✅ (checked)
- Secure: ❌ (unchecked in development - this is correct)

### 4. Check Server Logs

After login attempt, check server console for:
```
[Login] Received login request for project: ...
[Login] New session ID: ...
[Login] Session data set: ...
[Login] Session saved successfully
[Login] Login successful, sending response
```

### 5. Verify Session Persistence

After successful login:
1. Navigate to different pages (Usage, Cost, etc.)
2. Check Network tab → `/api/auth/session` requests
3. Should return `{ authenticated: true, project_id: "..." }`

## Common Issues & Solutions

### Issue: Still Redirected to Login

**Check:**
1. **Browser Console** - Any JavaScript errors?
2. **Network Tab** - Are cookies being sent? (Look for `Cookie` header)
3. **Server Logs** - Is session being created?
4. **Browser Settings** - Cookies enabled? Try incognito mode

**Solution:**
- Clear browser cookies for localhost
- Restart server
- Try in incognito/private window

### Issue: "Network error" on Login

**Check:**
- Server is running on port 3000
- No firewall blocking localhost:3000
- Browser console for CORS errors

### Issue: Session Cookie Not Set

**Check:**
- `SESSION_SECRET` is in `.env`
- Server restarted after adding `.env`
- No errors in server console

**Solution:**
- Verify `.env` file is in project root
- Restart server: `Ctrl+C` then `npm run dev`

### Issue: "Authentication required" on Protected Routes

**Check:**
- Session cookie exists in browser
- Network tab shows cookies being sent
- Server logs show session check

**Solution:**
- Clear cookies and login again
- Check `credentials: "include"` is in fetch calls (already fixed)

## Environment Variables Summary

### Local Development (.env)
```env
SESSION_SECRET=H7D7H67hhe784he8f84*&7d
OPENAI_API_KEY=sk-proj-...
PORT=3000
NODE_ENV=development
VOICEFLOW_API_KEY=VF.DM.... (optional)
```

### Render Production (Dashboard → Environment)
```env
DATABASE_URL=postgres://... (REQUIRED)
SESSION_SECRET=... (REQUIRED - use strong secret)
OPENAI_API_KEY=sk-proj-... (REQUIRED)
VOICEFLOW_API_KEY=VF.DM.... (optional)
NODE_ENV=production
NODE_VERSION=20.17.0
```

## Quick Debug Commands

### Check if server is running
```powershell
# In PowerShell
Test-NetConnection -ComputerName localhost -Port 3000
```

### Check environment variables loaded
Add this temporarily to `server/index.ts`:
```typescript
console.log("Environment check:", {
  hasSessionSecret: !!process.env.SESSION_SECRET,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT
});
```

### Clear browser cookies (DevTools)
1. Open DevTools (F12)
2. Application → Cookies → localhost
3. Right-click → Clear

## Next Steps if Still Not Working

1. **Share server logs** from login attempt
2. **Share browser console** errors
3. **Share Network tab** screenshot of `/api/auth/login` request
4. **Test in different browser** (Chrome, Firefox, Edge)

