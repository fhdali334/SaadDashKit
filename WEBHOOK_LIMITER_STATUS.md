# SaaSDashKit Webhook & Limiter Status

## Active Webhooks:
✅ Stripe Webhook: /api/webhook/stripe (port 3000)
   - Handles payment completions
   - Updates credit limits when payments succeed
   - Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

## Rate Limiting:
❌ No Express rate limiting middleware found
✅ Credit/Budget Limiting: Built-in credit limit system
   - Tracks usage against budget limits
   - Prevents over-budget usage
   - Configurable per project

## Voiceflow API Limits:
⚠️ Voiceflow has API rate limits (mentioned in logs)
   - Knowledge Base API limits
   - Usage Analytics API limits
   - Not webhook-based, handled via HTTP 429 responses

## To configure Stripe webhook:

1. Set environment variables:
   export STRIPE_SECRET_KEY='sk_test_your_key'
   export STRIPE_PUBLISHABLE_KEY='pk_test_your_key'

2. Login to Stripe CLI:
   stripe login

3. Start webhook forwarding:
   stripe listen --forward-to http://Mac:3000/api/webhook/stripe

4. Copy webhook secret from output to .env:
   export STRIPE_WEBHOOK_SECRET='whsec_your_webhook_secret'

The webhook is ready - just needs Stripe credentials!
