# Stripe Webhook Configuration

Webhook URL: http://Mac:3000/api/webhook/stripe

To configure this webhook with Stripe CLI:

1. Set your Stripe credentials:
   export STRIPE_SECRET_KEY='sk_test_your_secret_key'
   export STRIPE_PUBLISHABLE_KEY='pk_test_your_publishable_key'

2. Login to Stripe CLI:
   stripe login

3. Configure the webhook:
   stripe listen --forward-to http://Mac:3000/api/webhook/stripe

4. Copy the webhook secret from the output (whsec_...) to your .env file:
   export STRIPE_WEBHOOK_SECRET='whsec_your_webhook_secret'

5. The webhook will now forward events from Stripe to your local server!
