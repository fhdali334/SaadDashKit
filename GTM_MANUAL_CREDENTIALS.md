# Manual GTM Credentials Input (Alternative to OAuth)

## Problem
- Can't publish OAuth app
- Users don't want to add themselves as test users
- Need a way for users to provide their own credentials

## Solution: Manual Credentials Input

Users can provide their own credentials in two ways:

### Option 1: Service Account JSON Key (Recommended)
Users provide a service account JSON key file that has access to their GTM account.

**How it works:**
1. User creates a service account in their Google Cloud project
2. Grants service account access to their GTM account
3. Downloads JSON key file
4. Uploads/pastes JSON key in the app
5. App uses service account to access their GTM data

**Pros:**
- ✅ No OAuth consent screen needed
- ✅ No token refresh needed
- ✅ Works automatically
- ✅ User controls their own credentials

**Cons:**
- ⚠️ Users need to set up service account (one-time setup)
- ⚠️ More technical than OAuth

### Option 2: OAuth Tokens (Access Token + Refresh Token)
Users generate their own OAuth tokens and provide them to the app.

**How it works:**
1. User uses Google OAuth Playground or their own OAuth flow
2. Gets access token + refresh token
3. Provides tokens to the app
4. App uses tokens to access their GTM data

**Pros:**
- ✅ Works immediately
- ✅ No app publishing needed
- ✅ User controls their own tokens

**Cons:**
- ⚠️ Users need to generate tokens themselves
- ⚠️ Tokens expire (but refresh token handles this)
- ⚠️ More technical than OAuth flow

## Implementation Plan

1. Add UI for manual credential input (service account JSON or OAuth tokens)
2. Store credentials securely in database (encrypted)
3. Use provided credentials instead of OAuth flow
4. Support both methods (OAuth flow + manual input)

