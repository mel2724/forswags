# ForSwags Testing Guide

## Authentication Flow Testing

### 1. Sign Up Flow

#### Test Case: New Athlete Registration
1. **Navigate to**: `/auth`
2. **Click**: "Sign Up" tab
3. **Fill in**:
   - Full Name: `Test Athlete`
   - Email: `test.athlete+[timestamp]@example.com` (use timestamp to create unique emails)
   - Password: `TestPass123!`
4. **Check boxes**:
   - ✓ Accept Terms and Conditions
   - ✓ Accept Privacy Policy
5. **Click**: "Sign Up"
6. **Expected Result**: 
   - Success toast: "Account created!"
   - Automatically redirected to `/onboarding`
   - No email verification required (auto-confirm is enabled)

#### Test Case: Parent/Recruiter Registration
1. Follow steps 1-5 above
2. **At Onboarding**: Select "Parent" or "Recruiter" role
3. **Expected Result**:
   - Single-step onboarding for non-athletes
   - Redirected to `/dashboard` after completion

### 2. Sign In Flow

#### Test Case: Successful Login
1. **Navigate to**: `/auth`
2. **Stay on**: "Sign In" tab
3. **Enter credentials** from sign up
4. **Click**: "Sign In"
5. **Expected Result**:
   - Success toast: "Welcome back!"
   - Redirected to `/dashboard` (or `/onboarding` if incomplete)

#### Test Case: Wrong Password
1. Enter valid email with wrong password
2. **Expected Result**: Error message about invalid credentials

#### Test Case: Non-existent User
1. Enter email that wasn't registered
2. **Expected Result**: Error message about invalid credentials

### 3. Password Reset Flow

#### Test Case: Request Password Reset
1. **Navigate to**: `/auth`
2. **Click**: "Forgot your password?"
3. **Enter**: Your test email
4. **Click**: "Send Reset Email"
5. **Expected Result**:
   - Success toast: "Password reset email sent!"
   - Email arrives in inbox (check spam)

#### Test Case: Complete Password Reset
1. **Open**: Reset email
2. **Click**: Reset link
3. **Enter**: New password (twice)
4. **Click**: "Update Password"
5. **Expected Result**:
   - Success toast: "Password updated successfully!"
   - Redirected to `/dashboard`
   - Can now log in with new password

### 4. Session Persistence

#### Test Case: Page Refresh
1. Log in successfully
2. **Refresh** the page (F5)
3. **Expected Result**: Still logged in, no redirect to auth page

#### Test Case: New Tab
1. Log in successfully
2. Open new tab and visit the site
3. **Expected Result**: Still logged in across tabs

### 5. Role-Based Access

#### Test Case: Athlete-Only Pages
1. Log in as athlete
2. Navigate to: `/media-gallery`, `/evaluations`, `/college-matching`
3. **Expected Result**: Access granted

#### Test Case: Recruiter-Only Pages
1. Log in as recruiter
2. Navigate to: `/recruiter/athlete-search`, `/recruiter/analytics`
3. **Expected Result**: Access granted

#### Test Case: Admin-Only Pages
1. Log in as non-admin
2. Try to navigate to: `/admin/*`
3. **Expected Result**: Redirected to `/dashboard`

---

## Payment Testing (Stripe)

### Prerequisites
- **Test Mode**: Stripe is in test mode
- **Test Cards**: Use Stripe test card numbers
- **No Real Charges**: All payments are simulated

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### 1. Membership Subscription

#### Test Case: Monthly Subscription
1. **Log in** as athlete
2. **Navigate to**: `/membership`
3. **Verify**: Current status shows "No active subscription"
4. **Select**: Monthly plan ($37/month)
5. **Click**: "Subscribe Monthly"
6. **Expected Result**: Opens Stripe checkout in new tab

#### Test Case: Complete Stripe Checkout
1. On Stripe checkout page:
   - **Email**: Auto-filled
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/25`
   - **CVC**: `123`
   - **ZIP**: `12345`
2. **Click**: "Subscribe"
3. **Expected Result**:
   - Redirected back to `/membership?subscription=success`
   - Success toast displayed
   - Status updates to show active subscription

#### Test Case: Promo Code Application
1. **Before checkout**, enter promo code (if created)
2. **Click**: "Apply"
3. **Expected Result**:
   - Green checkmark: "✓ Promo code applied"
   - Discount shown in checkout

#### Test Case: Declined Card
1. Use declined card: `4000 0000 0000 0002`
2. **Expected Result**: Stripe shows decline message, no subscription created

### 2. Check Subscription Status

#### Test Case: Status Verification
1. **After subscribing**, navigate away then back to `/membership`
2. **Expected Result**:
   - Badge shows: "Current Plan: Pro Monthly" or "Championship Yearly"
   - Renewal date displayed
   - "Manage Subscription" button visible

#### Test Case: Customer Portal
1. **Click**: "Manage Subscription"
2. **Expected Result**:
   - Opens Stripe Customer Portal in new tab
   - Can view invoice history
   - Can update payment method
   - Can cancel subscription

### 3. Evaluation Purchase (One-Time Payment)

#### Test Case: Purchase Evaluation
1. **Navigate to**: `/purchase-evaluation`
2. **Fill in**:
   - Sport
   - Position
   - Upload video
3. **Click**: "Purchase Evaluation" ($197)
4. **Complete Stripe checkout** with test card
5. **Expected Result**:
   - Payment successful
   - Evaluation created in "pending" status
   - Available to coaches in `/coach/available-evaluations`

#### Test Case: Re-evaluation Purchase
1. **Navigate to**: `/purchase-evaluation`
2. **If previous evaluation exists**: Price should be $47 (re-evaluation rate)
3. **Complete purchase**
4. **Expected Result**: Lower price charged

### 4. PayPal Testing (Optional)

⚠️ **Note**: PayPal integration requires additional setup:
- PayPal Business account
- PayPal plan IDs configured
- Webhook setup

#### Test Case: PayPal Selection
1. **Navigate to**: `/membership`
2. **Select**: "PayPal" payment method
3. **Click**: "Subscribe"
4. **Expected Result**: 
   - Currently shows: "PayPal subscription plans need to be set up"
   - After setup: Redirects to PayPal checkout

---

## Test User Accounts

### Create Test Users for Each Role

#### Athlete Test User
```
Email: test.athlete@forswags.test
Password: TestAthlete123!
Role: Athlete
```

#### Recruiter Test User
```
Email: test.recruiter@forswags.test
Password: TestRecruiter123!
Role: Recruiter
```

#### Parent Test User
```
Email: test.parent@forswags.test
Password: TestParent123!
Role: Parent
```

#### Coach Test User
```
Email: test.coach@forswags.test
Password: TestCoach123!
Role: Coach (must be assigned by admin)
```

#### Admin Test User
```
Email: admin@forswags.test
Password: AdminTest123!
Roles: Admin, Athlete (for testing both interfaces)
```

### How to Assign Admin/Coach Roles
1. **Via Database**: Use Lovable Cloud dashboard
2. **Navigate to**: user_roles table
3. **Insert**: 
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('[user-uuid]', 'admin');
   ```

---

## Common Testing Issues & Solutions

### Authentication Issues

#### Issue: "Requested path is invalid"
**Cause**: Site URL/Redirect URL not configured
**Solution**: 
1. Open Lovable Cloud dashboard (backend)
2. Go to Auth Settings
3. Add your preview URL to authorized redirects

#### Issue: User stuck on auth page after signup
**Cause**: Email confirmation required
**Solution**: Auto-confirm is now enabled, but verify in Auth Settings

#### Issue: Session not persisting across tabs
**Cause**: Browser privacy settings or incognito mode
**Solution**: Test in normal browser window with cookies enabled

### Payment Issues

#### Issue: Stripe checkout doesn't open
**Check**:
1. Console for errors
2. Edge function logs: `supabase functions logs create-checkout`
3. STRIPE_SECRET_KEY is configured

#### Issue: Subscription not showing after payment
**Solutions**:
1. Wait 10-15 seconds, then click "Check Subscription Status"
2. Check Stripe dashboard for successful payment
3. Verify `check-subscription` function logs

#### Issue: Promo code won't apply
**Check**:
1. Promo code exists in `promo_codes` table
2. Code is active (`is_active = true`)
3. Not expired (`valid_until` is future date)
4. Has remaining uses (`times_used < max_uses`)

---

## Edge Function Debugging

### View Function Logs
```bash
# Via Lovable Cloud dashboard
1. Open backend
2. Navigate to Edge Functions
3. Select function (create-checkout, check-subscription, etc.)
4. View logs tab
```

### Common Log Messages
```
[CREATE-CHECKOUT] Function started
[CREATE-CHECKOUT] User authenticated - {"userId":"..."}
[CREATE-CHECKOUT] Checkout session created - {"sessionId":"..."}

[CHECK-SUBSCRIPTION] No customer found
[CHECK-SUBSCRIPTION] Active subscription found
```

---

## Pre-Launch Checklist

### Authentication
- [ ] Sign up flow works for all roles
- [ ] Sign in flow works
- [ ] Password reset email received
- [ ] Session persists across page refresh
- [ ] Role-based access control works
- [ ] Onboarding completes for all roles

### Payments (Stripe)
- [ ] Monthly subscription checkout works
- [ ] Yearly subscription checkout works
- [ ] Subscription status updates after payment
- [ ] Customer portal accessible
- [ ] Can cancel subscription
- [ ] Promo codes apply correctly
- [ ] Evaluation purchase works
- [ ] Re-evaluation discount applies

### Database
- [ ] User profiles created correctly
- [ ] Roles assigned properly
- [ ] Memberships recorded
- [ ] Payment records stored

### Email Notifications
- [ ] Password reset emails arrive
- [ ] Welcome emails sent (if configured)
- [ ] Payment receipts sent (if configured)

---

## Quick Test Script

Run this complete test in 10 minutes:

1. **Sign Up**: Create new athlete account (2 min)
2. **Onboarding**: Complete athlete profile (2 min)
3. **Subscribe**: Purchase monthly membership (2 min)
4. **Verify**: Check subscription status (1 min)
5. **Portal**: Open customer portal, view details (1 min)
6. **Cancel**: Cancel subscription (test only) (1 min)
7. **Sign Out/In**: Test session persistence (1 min)

**Success Criteria**: All steps complete without errors

---

## Test Data Cleanup

### After Testing
1. **Delete test users**: Via user management or database
2. **Cancel subscriptions**: Via Stripe dashboard or customer portal
3. **Clear test data**: Remove test athlete profiles, evaluations, etc.

### Stripe Test Data
- Test mode data can be left as-is
- Periodically clear old test data from Stripe dashboard
- No real charges are ever made in test mode

---

## Production Pre-Flight

### Before Going Live

#### Switch to Production
1. **Stripe**: Update STRIPE_SECRET_KEY to production key
2. **PayPal**: Update to production credentials
3. **Domain**: Configure custom domain
4. **Auth**: Update Site URL and Redirect URLs to production domain

#### Production Testing
- [ ] Test with real email addresses (yours)
- [ ] **DO NOT** use real credit cards until ready
- [ ] Verify webhooks work in production
- [ ] Test one real $1 subscription (refund immediately)
- [ ] Verify customer portal works in production

#### Monitoring
- [ ] Set up error tracking
- [ ] Monitor edge function logs
- [ ] Track failed payments
- [ ] Monitor user signups

---

## Support Resources

### Stripe Testing
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)

### Supabase
- [Auth Documentation](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

### ForSwags Documentation
- Privacy Policy: `/privacy`
- Terms & Conditions: `/terms`
- Contact: `/contact`
