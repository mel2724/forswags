# PayPal Integration Setup Guide

## Prerequisites
- PayPal Business Account
- API Credentials (Client ID & Secret) - ✅ Already added to secrets

## Step 1: Create Subscription Plans in PayPal

1. Log in to your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Go to "Apps & Credentials" and select your app
3. Navigate to "Products" > "Subscriptions" > "Plans"

### Create Monthly Plan
- **Plan Name**: Pro Monthly
- **Billing Cycle**: Every 1 month
- **Price**: $14.99 USD
- **Description**: Monthly subscription for ForSWAGs Pro

### Create Yearly Plan
- **Plan Name**: Championship Yearly
- **Billing Cycle**: Every 1 year
- **Price**: $97.00 USD
- **Description**: Yearly subscription for ForSWAGs Championship

## Step 2: Update Code with PayPal Plan IDs

After creating the plans, copy their Plan IDs and update the code:

1. Open `src/lib/stripeConfig.ts`
2. Add PayPal plan IDs:

```typescript
export const PAYPAL_PLANS = {
  athlete: {
    monthly: "P-XXXXXXXXXXXXX", // Replace with your PayPal Plan ID
    yearly: "P-XXXXXXXXXXXXX",  // Replace with your PayPal Plan ID
  }
};
```

3. Update `src/pages/Membership.tsx` in the `handleSubscribe` function to use actual Plan IDs

## Step 3: Configure PayPal Webhooks

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Select your app under "Apps & Credentials"
3. Scroll to "Webhooks" section
4. Click "Add Webhook"
5. Set Webhook URL to: `https://YOUR_PROJECT_URL.supabase.co/functions/v1/paypal-webhook`

### Select these webhook events:
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `PAYMENT.SALE.COMPLETED`

## Step 4: Test the Integration

### Using PayPal Sandbox (Recommended for testing)
1. Switch to Sandbox mode in PayPal Developer Dashboard
2. Create test buyer accounts
3. Use Sandbox credentials in your secrets
4. Test the subscription flow

### Going Live
1. Switch to Live credentials in your Lovable secrets
2. Update webhook URL to production edge function URL
3. Test with a real PayPal account

## Important Notes

- **Promo codes** work only with Stripe currently
- PayPal subscriptions are managed through PayPal's interface
- Users will be redirected to PayPal for payment processing
- Subscription status is synced via webhooks

## Troubleshooting

### Users not seeing PayPal option
- Verify PayPal credentials are set correctly
- Check console logs in edge functions

### Subscription not activating
- Check webhook is configured correctly
- Review edge function logs for errors
- Verify Plan IDs are correct

## Support
- [PayPal Subscriptions Documentation](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)
