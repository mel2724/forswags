# ForSwags - Testing Summary & Quick Start

## ✅ Completed Setup

### Authentication ✓
- [x] Sign up with email/password
- [x] Login/logout functionality
- [x] Password reset flow
- [x] Session persistence
- [x] Auto-confirm email enabled (no verification needed)
- [x] Role-based access (athlete, parent, recruiter, coach, admin)
- [x] Onboarding flows for each role
- [x] Terms & Privacy acceptance tracking

### Payment Systems ✓
- [x] Stripe integration configured
- [x] Membership subscriptions (monthly & yearly)
- [x] Evaluation purchases (initial & re-evaluation)
- [x] Promo code system
- [x] Customer portal for subscription management
- [x] PayPal integration setup (requires plan configuration)
- [x] Tier-based pricing with database functions

### Products & Pricing
```
Memberships (Athletes):
- Free: $0/month
- Pro Monthly: $14.99/month
- Championship Yearly: $97/year (saves $82)

Memberships (Recruiters):
- Monthly: $97/month
- Yearly: $997/year

Evaluations:
- Initial: $97
- Re-evaluation: $49 (within 1 year)
```

---

## 🚀 Quick Test (5 Minutes)

### 1. Authentication Test
```bash
Time: 2 minutes

✓ Visit /auth
✓ Sign up: test+[timestamp]@example.com
✓ Password: TestPass123!
✓ Accept terms/privacy
✓ Complete onboarding
✓ See dashboard

Expected: No errors, redirected to dashboard
```

### 2. Subscription Test
```bash
Time: 3 minutes

✓ Go to /membership
✓ Click "Subscribe Monthly"
✓ Use test card: 4242 4242 4242 4242
✓ Complete checkout
✓ See "Current Plan: Pro Monthly"

Expected: Success message, subscription active
```

---

## 📋 Complete Test Checklist

### Authentication Flows
- [ ] New user signup (athlete)
- [ ] New user signup (parent)
- [ ] New user signup (recruiter)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Password reset request
- [ ] Password reset completion
- [ ] Session persists on refresh
- [ ] Session persists in new tab
- [ ] Logout works

### Stripe Payments
- [ ] Monthly subscription checkout
- [ ] Yearly subscription checkout
- [ ] Checkout with success card (4242...)
- [ ] Checkout with decline card (4000 0000 0000 0002)
- [ ] Subscription status updates after payment
- [ ] "Current Plan" badge displays
- [ ] Customer portal opens
- [ ] Promo code validates
- [ ] Promo code applies discount
- [ ] Evaluation purchase ($97)
- [ ] Re-evaluation purchase ($49)

### Edge Functions
- [ ] create-checkout returns session URL
- [ ] check-subscription returns status
- [ ] customer-portal opens successfully
- [ ] create-evaluation-payment works

### Role-Based Access
- [ ] Athletes can access /media-gallery
- [ ] Athletes can access /evaluations
- [ ] Recruiters can access /recruiter/*
- [ ] Non-admins blocked from /admin/*
- [ ] Coaches can access /coach/*

---

## 🎯 Priority Testing Areas

### High Priority (Must Test)
1. **User Registration** - Core user onboarding
2. **Login/Logout** - Basic authentication
3. **Subscription Purchase** - Revenue critical
4. **Subscription Status** - User experience critical

### Medium Priority (Should Test)
1. Password reset flow
2. Promo code application
3. Customer portal access
4. Evaluation purchases

### Low Priority (Nice to Have)
1. PayPal integration
2. Session edge cases
3. Multiple browser testing

---

## 🔍 Where to Find Test Data

### Stripe Test Cards
```
Success:           4242 4242 4242 4242
Declined:          4000 0000 0000 0002
Requires Auth:     4000 0025 0000 3155
Insufficient:      4000 0000 0000 9995

Any future expiry: 12/25
Any CVC:          123
Any ZIP:          12345
```

### Edge Function Logs
```
Location: Lovable Cloud Dashboard > Edge Functions

Key Functions:
- create-checkout
- check-subscription
- customer-portal
- create-evaluation-payment
- verify-evaluation-payment
```

### Database Tables to Monitor
```
- user_roles (role assignment)
- memberships (subscription status)
- evaluations (evaluation purchases)
- profiles (user data)
- athletes (athlete profiles)
```

---

## ⚠️ Known Testing Gotchas

### 1. Email Confirmation
- **Issue**: Users expect email verification
- **Reality**: Auto-confirm is enabled
- **Result**: Users can login immediately after signup

### 2. Subscription Status Delay
- **Issue**: Status doesn't update instantly
- **Solution**: Wait 10-15 seconds, refresh page
- **Or**: Click "Check Subscription Status" button

### 3. Test Cards
- **Issue**: Using real card numbers
- **Solution**: Always use Stripe test cards in test mode
- **Check**: Look for "TEST MODE" badge in Stripe

### 4. Promo Codes
- **Issue**: Code not working
- **Check**:
  - Code exists in database
  - is_active = true
  - Not expired
  - Has remaining uses

### 5. PayPal
- **Issue**: PayPal button doesn't work
- **Reality**: Requires additional setup
- **Status**: Edge function exists, needs plan IDs

---

## 🐛 Common Errors & Fixes

### "Requested path is invalid"
```
Problem: Auth redirect URLs not configured
Fix: Add preview URL to Auth Settings in Cloud dashboard
```

### "STRIPE_SECRET_KEY is not set"
```
Problem: Stripe key missing
Fix: Verify secret in Cloud dashboard > Secrets
```

### "User not authenticated"
```
Problem: Session expired or not logged in
Fix: Sign in again
```

### Checkout doesn't open
```
Problem: Edge function error
Check: 
1. Browser console for errors
2. Edge function logs
3. STRIPE_SECRET_KEY configured
```

### Subscription not showing
```
Problem: Check-subscription needs refresh
Fix:
1. Wait 15 seconds
2. Refresh page
3. Check Stripe dashboard for payment
```

---

## 📊 Success Metrics

### Authentication
- ✅ 100% signup completion rate (test users)
- ✅ No errors in console
- ✅ Session persists across refresh

### Payments
- ✅ Checkout opens without errors
- ✅ Test payments succeed
- ✅ Subscription status updates within 30 seconds
- ✅ Customer portal accessible

### User Experience
- ✅ No redirect loops
- ✅ Appropriate error messages
- ✅ Loading states visible
- ✅ Success confirmations clear

---

## 🎬 Next Steps After Testing

### If All Tests Pass
1. Review testing guide: `TESTING_GUIDE.md`
2. Begin user acceptance testing (UAT)
3. Test on different devices/browsers
4. Prepare for production switch

### If Tests Fail
1. Check edge function logs
2. Verify all secrets configured
3. Review database RLS policies
4. Check browser console errors
5. Refer to troubleshooting section

### Before Production
1. Switch Stripe to live mode
2. Configure PayPal plans (if using)
3. Update redirect URLs to production
4. Test one real transaction ($1)
5. Set up monitoring/alerting

---

## 📞 Support Resources

### Documentation
- Full Testing Guide: `TESTING_GUIDE.md`
- Stripe Docs: https://stripe.com/docs/testing
- Supabase Auth: https://supabase.com/docs/guides/auth

### Monitoring
- Stripe Dashboard: https://dashboard.stripe.com
- Edge Function Logs: Lovable Cloud Dashboard
- Database: Lovable Cloud > Database

### Quick Links
- Privacy Policy: `/privacy`
- Terms: `/terms`
- Contact: `/contact`

---

## 🎯 Pre-Launch Final Checklist

- [ ] All authentication flows tested
- [ ] All payment flows tested
- [ ] No console errors
- [ ] Edge functions logging correctly
- [ ] Database tables populated correctly
- [ ] User roles assigned properly
- [ ] RLS policies working
- [ ] Email notifications working (if configured)
- [ ] Mobile responsive testing complete
- [ ] Cross-browser testing complete

**Status**: Ready for UAT ✓

---

## 💡 Testing Tips

1. **Use Unique Emails**: Add `+timestamp` to test emails
   - Example: `test+20250106@example.com`

2. **Keep Test Cards Handy**: Bookmark Stripe test cards page

3. **Monitor Logs**: Keep edge function logs open during testing

4. **Test Incrementally**: Don't test everything at once

5. **Document Issues**: Note any unexpected behavior

6. **Clean Up**: Delete test data after testing

7. **Test Real Flows**: Complete full user journeys, not just individual features
