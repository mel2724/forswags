# ForSWAGs Membership System Guide

## Overview

ForSWAGs uses a tiered membership system to provide both free and premium access to our platform. This guide explains how the membership system works, what features are available at each tier, and how to test and manage memberships.

## Membership Tiers

### Free Tier (Default)

All new users start on the free tier automatically. No payment required.

**Features:**
- ✅ Basic athlete profile
- ✅ 1 video upload
- ✅ Basic profile fields (Name, Sport, Position, Height, Weight, High School, Graduation Year)
- ✅ GPA only (no SAT/ACT scores)
- ✅ 200-character bio limit
- ✅ Full access to Playbook educational content
- ✅ Basic college matching

**Restrictions:**
- ❌ Cannot upload more than 1 video
- ❌ Premium profile fields locked (SAT/ACT, test scores, advanced stats, etc.)
- ❌ Bio limited to 200 characters (premium: 1,000 characters)
- ❌ No highlight video URL field
- ❌ Limited analytics
- ❌ No AI content generation tools
- ❌ Standard recruiter visibility

### Pro Monthly Tier ($40/month)

**All Free Features PLUS:**
- ✅ **Unlimited video uploads** - Showcase your full athletic journey
- ✅ **Complete profile access** - SAT/ACT scores, athletic test results (40-yard, vertical, bench, squat)
- ✅ **1,000-character bio** - Tell your full story
- ✅ **Highlight video URL** - Link to external highlight reels
- ✅ **Advanced stats tracking** - Detailed performance metrics
- ✅ **Awards & achievements** - Full athletic and academic honors
- ✅ **Social media fields** - Twitter, Instagram, TikTok handles
- ✅ **Extended personal fields** - 5-year goals, motivation, challenges overcome, role model, community involvement
- ✅ **Advanced analytics** - Track profile views, recruiter engagement
- ✅ **AI content tools** - Generate social media captions and press releases
- ✅ **Priority support** - 24/7 assistance
- ✅ **3x more profile views** - Priority placement in recruiter searches

**Pricing:**
- $40/month
- Billed monthly
- Cancel anytime
- 30-day money-back guarantee

### Championship Yearly Tier ($260/year)

**Save 46% compared to monthly pricing!**

**All Pro Monthly Features PLUS:**
- ✅ **2 months FREE** - $80 value included
- ✅ **Exclusive webinars** - Monthly recruiting strategy sessions
- ✅ **Early access** - Beta features before general release
- ✅ **VIP support** - Dedicated account manager
- ✅ **Priority feature requests** - Your feedback matters most

**Pricing:**
- $260/year ($21.67/month)
- Save $220 compared to monthly plan
- Cancel anytime with pro-rated refund
- 30-day money-back guarantee

## How Membership Works

### 1. Account Creation
- All new accounts start on **Free Tier** automatically
- No credit card required to sign up
- Complete onboarding to access the platform

### 2. Upgrading to Premium
Users can upgrade at any time via:
- Dashboard upgrade prompts
- `/membership` page
- Feature-specific upgrade dialogs (e.g., when trying to upload a 2nd video)

**Upgrade Process:**
1. Navigate to `/membership`
2. Choose Pro Monthly or Championship Yearly
3. Complete Stripe checkout
4. Instant access to premium features

### 3. Membership Status Checking
The system automatically checks membership status:
- On login
- Every minute while user is active
- After payment completion
- When accessing restricted features

### 4. Renewal System

**Automatic Renewal Emails:**
The system sends automated reminder emails:
- **30 days before expiration** - "Your membership renews soon"
- **7 days before expiration** - "Your membership expires in 1 week"
- **1 day before expiration** - "URGENT: Your membership expires tomorrow"

**Cron Job:**
- Runs daily at 9:00 AM UTC
- Checks for memberships expiring in next 30 days
- Sends reminder emails automatically
- Tracks sent reminders to avoid duplicates

### 5. Login Blocking for Expired Memberships

**Automatic Login Prevention:**
When a user's membership expires or payment fails, they are automatically blocked from logging in.

**Blocked States:**
- `status = 'active'` but `end_date` is in the past
- `status = 'past_due'` (payment failed)

**User Experience:**
1. User attempts to login
2. System checks `can_user_login()` function
3. If membership expired/failed:
   - Login is blocked
   - Error message displayed: "Your membership has expired. Please renew to continue."
   - User redirected to `/membership` page
4. User can renew and immediately regain access

**Implementation:**
- Enforced in `src/pages/Auth.tsx`
- Uses database function `can_user_login(user_id)`
- Returns JSON with `can_login` boolean and reason

## Feature Access Control

### Frontend Enforcement

**Profile Page (`src/pages/Profile.tsx`):**
```typescript
const { hasAccess: hasPremiumProfile } = useFeatureAccess('profile_type');

// Premium fields are conditionally rendered
{hasPremiumProfile ? (
  <Input name="sat_score" />
) : (
  <LockedFieldMessage />
)}
```

**Media Gallery (`src/pages/MediaGallery.tsx`):**
```typescript
const { tier, canUploadVideo } = useMembershipStatus();

// Check video count before upload
if (tier === 'free' && videoCount >= 1) {
  showUpgradeDialog();
  return;
}
```

### Backend Enforcement (Database)

**Database Function: `has_feature_access(user_id, feature_key)`**
- Checks user's tier from active membership
- Queries `tier_features` table for feature availability
- Returns boolean indicating access

**Tier Features Configuration:**
Stored in `tier_features` table:
```sql
-- Free tier
tier: 'free'
feature_key: 'video_upload_limit'
limit_value: 1

tier: 'free'
feature_key: 'profile_type'
limit_value: 0  -- Basic profile

-- Pro tier
tier: 'pro_monthly'
feature_key: 'video_upload_limit'
limit_value: NULL  -- Unlimited

tier: 'pro_monthly'
feature_key: 'profile_type'
limit_value: 1  -- Premium profile
```

## Testing the Membership System

### Test Scenario 1: Free Tier Restrictions

1. Create new account (auto free tier)
2. Go to `/profile`
   - ✅ Should see basic fields only
   - ✅ Premium fields should show locked state
3. Go to `/media-gallery`
   - ✅ Upload 1 video - should succeed
   - ✅ Try to upload 2nd video - should show upgrade dialog
4. Dashboard should show upgrade prompts

### Test Scenario 2: Premium Upgrade

1. Navigate to `/membership`
2. Review feature comparison table
3. Click "Subscribe Monthly" or "Subscribe Yearly"
4. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
5. Verify:
   - ✅ Redirect to success page
   - ✅ Dashboard updates with "Pro Monthly" or "Championship Yearly" badge
   - ✅ All profile fields unlocked
   - ✅ Can upload unlimited videos
   - ✅ Upgrade prompts disappear

### Test Scenario 3: Renewal Reminders

**Manual Test:**
1. Create a membership with `end_date` 30 days in future
2. Manually trigger edge function:
   ```bash
   curl -X POST https://[project-id].supabase.co/functions/v1/send-renewal-reminders \
     -H "Authorization: Bearer [anon-key]"
   ```
3. Check email was sent
4. Verify reminder logged in `membership_renewal_reminders` table

**Automated Test:**
1. Wait for daily cron job (9 AM UTC)
2. Check edge function logs
3. Verify emails sent to users with expiring memberships

### Test Scenario 4: Login Blocking

1. Create test user with subscription
2. Manually expire membership:
   ```sql
   UPDATE memberships 
   SET end_date = NOW() - INTERVAL '1 day'
   WHERE user_id = '[test-user-id]';
   ```
3. Logout
4. Try to login
5. Verify:
   - ✅ Login blocked
   - ✅ Error message: "Your membership has expired"
   - ✅ Redirected to `/membership` page
6. Renew membership
7. Verify can login again

### Test Scenario 5: Feature Comparison

1. Navigate to `/membership` (logged out or free tier)
2. Review feature comparison table
3. Verify:
   - ✅ Free tier shows limitations
   - ✅ Pro tier shows "Unlimited" and checkmarks
   - ✅ All features listed accurately
   - ✅ Pricing displayed correctly
   - ✅ "Save 46%" badge on yearly plan

## Stripe Test Cards

Use these cards for testing payments:

| Card Number | Result | Use Case |
|-------------|--------|----------|
| 4242 4242 4242 4242 | ✅ Success | Standard successful payment |
| 4000 0000 0000 0002 | ❌ Declined | Test declined payment |
| 4000 0025 0000 3155 | 🔐 Auth Required | Test 3D Secure |
| 4000 0000 0000 0341 | 💳 Attached to customer | Test existing customer |

**All test cards:**
- Expiry: 12/25 (any future date)
- CVC: 123 (any 3 digits)
- ZIP: 12345 (any valid ZIP)

## Promo Codes

Test promo code functionality:

1. Navigate to `/membership`
2. Enter promo code in the field
3. Click "Apply"
4. Verify discount applied to checkout

**Test Promo Codes:**
Create test codes in database:
```sql
INSERT INTO promo_codes (code, discount_type, discount_value, valid_until, max_uses)
VALUES 
  ('TEST20', 'percentage', 20, NOW() + INTERVAL '30 days', 100),
  ('SAVE10', 'fixed', 10, NOW() + INTERVAL '30 days', 50);
```

## Managing Subscriptions

### Customer Portal

Premium users can manage their subscriptions via Stripe Customer Portal:

1. Navigate to `/membership` (while subscribed)
2. Click "Manage Subscription"
3. Stripe portal opens in new tab
4. Users can:
   - Update payment method
   - View billing history
   - Cancel subscription
   - Download invoices

**Implementation:**
- Edge function: `customer-portal`
- Creates portal session for logged-in user
- Returns portal URL

### Cancellation

Users can cancel via:
1. Customer portal (self-service)
2. Admin panel (admin-initiated)
3. Stripe dashboard (manual)

**After Cancellation:**
- Access continues until end of billing period
- Then membership expires
- Login blocking takes effect
- User can re-subscribe anytime

## Admin Management

Admins can manage all memberships via `/admin` panel:

**Admin Capabilities:**
- View all active memberships
- Manually extend/expire memberships
- Issue refunds
- Apply promo codes
- View renewal reminder history
- Monitor subscription analytics

## Database Schema

### `memberships` Table
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- plan (text): 'free', 'pro_monthly', 'championship_yearly'
- status (text): 'active', 'past_due', 'canceled', 'trialing'
- stripe_customer_id (text)
- stripe_subscription_id (text)
- start_date (timestamptz)
- end_date (timestamptz)
- archived_data (jsonb)
- downgraded_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `membership_renewal_reminders` Table
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- membership_id (uuid, FK)
- reminder_type (text): '30_days', '7_days', '1_day'
- sent_at (timestamptz)
- email_sent_at (timestamptz)
- created_at (timestamptz)
```

### `tier_features` Table
```sql
- id (uuid, PK)
- tier (text): 'free', 'pro_monthly', 'championship_yearly'
- feature_key (text): 'video_upload_limit', 'profile_type', etc.
- is_enabled (boolean)
- limit_value (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## Edge Functions

### `create-checkout`
Creates Stripe checkout session for subscription purchase.

**Endpoint:** `/functions/v1/create-checkout`
**Method:** POST
**Auth:** Required (JWT)
**Body:**
```json
{
  "priceId": "price_xxx",
  "promoCode": "OPTIONAL_CODE"
}
```

### `check-subscription`
Checks user's current subscription status.

**Endpoint:** `/functions/v1/check-subscription`
**Method:** POST
**Auth:** Required (JWT)
**Returns:**
```json
{
  "subscribed": true,
  "product_id": "prod_xxx",
  "subscription_end": "2025-02-01T00:00:00Z"
}
```

### `customer-portal`
Creates Stripe Customer Portal session.

**Endpoint:** `/functions/v1/customer-portal`
**Method:** POST
**Auth:** Required (JWT)
**Returns:**
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

### `send-renewal-reminders`
Sends automated renewal reminder emails.

**Endpoint:** `/functions/v1/send-renewal-reminders`
**Method:** POST
**Auth:** Not required (cron job)
**Schedule:** Daily at 9:00 AM UTC

## Troubleshooting

### Subscription not showing after payment

**Symptoms:**
- Paid but still shows free tier
- Features still locked

**Solutions:**
1. Wait 15 seconds, refresh page
2. Click "Check Subscription" on membership page
3. Verify payment in Stripe dashboard
4. Check edge function logs for errors
5. Ensure `check-subscription` function has correct Stripe keys

### Video upload still blocked

**Symptoms:**
- Upgraded to premium but can't upload 2nd video

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check membership status on dashboard
4. Verify `useMembershipStatus` hook returning correct tier
5. Check browser console for errors

### Premium fields not unlocked

**Symptoms:**
- Profile fields still show as locked after upgrade

**Solutions:**
1. Refresh page
2. Check `useFeatureAccess` hook
3. Verify `tier_features` table has correct configuration
4. Check database function `has_feature_access()` returns true
5. Review browser console for errors

### Renewal emails not sending

**Symptoms:**
- No emails at 30/7/1 days before expiration

**Solutions:**
1. Check cron job is running (Lovable Cloud dashboard)
2. Verify `RESEND_API_KEY` is configured
3. Check edge function logs for `send-renewal-reminders`
4. Ensure `membership_renewal_reminders` table exists
5. Verify email template exists in `supabase/functions/_templates/`

### Login blocked incorrectly

**Symptoms:**
- Active membership but can't login

**Solutions:**
1. Check `end_date` in memberships table
2. Verify `status = 'active'`
3. Review `can_user_login()` function logic
4. Check Auth.tsx implementation
5. Ensure no timezone issues with date comparisons

## Best Practices

### For Development

1. **Always test both tiers** - Free and premium functionality
2. **Use test cards** - Never use real credit cards in development
3. **Monitor edge function logs** - Essential for debugging payment issues
4. **Check database state** - Verify membership records after actions
5. **Test renewal flow** - Manually trigger reminders to verify email templates

### For Production

1. **Monitor cron jobs** - Ensure renewal reminders send daily
2. **Track conversion rates** - Monitor free-to-premium upgrades
3. **Watch for payment failures** - Set up alerts for `past_due` status
4. **Review analytics** - Check which features drive upgrades
5. **Customer support** - Have process for manual subscription management

## Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Resend Email API**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **ForSWAGs Testing Guide**: See TESTING_GUIDE.md

## Support

For issues or questions:
1. Check edge function logs
2. Review this documentation
3. Search Stripe documentation
4. Contact development team
5. File GitHub issue with full details
