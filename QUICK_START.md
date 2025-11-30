# ForSwags - Developer Quick Start

## 🚀 Start Testing in 60 Seconds

### Step 1: Create Test Account (20 sec)
```
1. Go to /auth
2. Click "Sign Up"
3. Email: test+today@example.com
4. Password: TestPass123!
5. Check both boxes
6. Click "Sign Up"
```

**Note**: New accounts start on the FREE tier with:
- ✅ 1 video upload limit
- ✅ Basic profile fields only
- ✅ Access to Playbook content

### Step 2: Complete Onboarding (20 sec)
```
1. Select "Athlete"
2. Fill basic info (name, sport)
3. Select sport and position
4. Skip optional fields (premium only)
5. Accept consent
6. Click "Complete"
```

### Step 3: Test Premium Upgrade (20 sec)
```
1. See upgrade prompt on dashboard
2. Go to /membership
3. Click "Subscribe Monthly" or "Subscribe Yearly"
4. Card: 4242 4242 4242 4242
5. Expiry: 12/25
6. CVC: 123
7. Click "Subscribe"
```

**Done!** You now have:
- ✅ Free tier account (default)
- ✅ Optional premium subscription (if upgraded)
- ✅ Full access to test all features

---

## 🔑 Essential Test Data

### Stripe Test Cards
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 Requires Auth |

**All cards**: Expiry `12/25`, CVC `123`, ZIP `12345`

### Test User Templates
```
Athlete:   test.athlete@test.com   / TestAthlete123!
Recruiter: test.recruiter@test.com / TestRecruiter123!
Parent:    test.parent@test.com    / TestParent123!
```

---

## 📋 10-Minute Full Test

| Test | Time | Steps |
|------|------|-------|
| **1. Signup** | 2min | Create account, complete onboarding |
| **2. Login** | 1min | Logout, login again |
| **3. Subscribe** | 3min | Purchase monthly subscription |
| **4. Verify** | 2min | Check status, open portal |
| **5. Profile** | 2min | Edit profile, add media |

**Total**: 10 minutes for complete user journey

---

## 🎯 Critical Features to Test

### Free Tier Features ✅
- [ ] User signup (starts on free tier)
- [ ] User login
- [ ] Basic profile editing (limited fields)
- [ ] 1 video upload (should block 2nd upload)
- [ ] Playbook access
- [ ] View upgrade prompts

### Premium Features 📝
- [ ] Subscription purchase (monthly/yearly)
- [ ] Subscription status check
- [ ] Unlimited video uploads
- [ ] Full profile access (SAT/ACT, stats, etc.)
- [ ] Analytics dashboard
- [ ] AI content generation
- [ ] Customer portal access

### Membership Management 🔐
- [ ] Membership renewal reminders (30/7/1 days)
- [ ] Login blocking for expired memberships
- [ ] Upgrade prompts display correctly
- [ ] Feature comparison table on /membership

### Should Test 📝
- [ ] Password reset
- [ ] Promo codes
- [ ] Evaluation purchase
- [ ] Parent consent flow
- [ ] Coach evaluations

### Nice to Have 🌟
- [ ] Mobile responsive
- [ ] Multiple browsers
- [ ] Edge cases
- [ ] Social media integrations

---

## 🐛 Quick Troubleshooting

### Can't create account
- Check browser console
- Verify email format
- Password must be 6+ chars

### Checkout won't open
- Check STRIPE_SECRET_KEY configured
- Look at edge function logs
- Try in incognito mode

### Subscription not showing
- Wait 15 seconds, refresh
- Click "Check Subscription"
- Verify payment in Stripe dashboard

### Auth redirect error
- Add preview URL to Auth Settings
- Check Site URL configuration

---

## 📁 Important Files

### Testing
- `TESTING_GUIDE.md` - Complete testing documentation
- `TESTING_SUMMARY.md` - Testing overview
- `QUICK_START.md` - This file

### Configuration
- `src/lib/stripeConfig.ts` - Product/price configuration
- `supabase/functions/` - Edge functions

### Key Pages
- `/auth` - Authentication
- `/onboarding` - User setup
- `/membership` - Subscriptions
- `/dashboard` - Main app

---

## 🔍 Where to Look for Logs

### Edge Functions
```
Lovable Cloud Dashboard > Edge Functions > [Function Name] > Logs

Key functions:
- create-checkout
- check-subscription
- customer-portal
```

### Browser Console
```
F12 > Console

Look for:
- [CREATE-CHECKOUT] logs
- [CHECK-SUBSCRIPTION] logs
- Error messages
```

### Stripe Dashboard
```
https://dashboard.stripe.com/test/

Check:
- Payments
- Customers
- Subscriptions
```

---

## 💾 Test Data Cleanup

### Quick Clean
```sql
-- Via Lovable Cloud Database

DELETE FROM user_roles WHERE user_id = '[test-user-id]';
DELETE FROM memberships WHERE user_id = '[test-user-id]';
DELETE FROM athletes WHERE user_id = '[test-user-id]';
DELETE FROM profiles WHERE id = '[test-user-id]';
```

### Or Use UI
```
1. Go to admin panel
2. Find test user
3. Delete user (cascades to related data)
```

---

## 🎓 Learning Resources

### Quick Refs
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Edge Functions](https://supabase.com/docs/guides/functions)

### Full Docs
- `TESTING_GUIDE.md` - Comprehensive testing
- `TESTING_SUMMARY.md` - Testing overview
- `README.md` - Project overview

---

## ⚡ Power User Tips

### 1. Unique Test Emails
```
test+001@example.com
test+002@example.com
test+20250106@example.com
```

### 2. Auto-Confirm is Enabled
- No need to check email
- Can login immediately
- Faster testing

### 3. Test in Incognito
- Fresh session
- No cached data
- Clean slate

### 4. Keep Stripe Dashboard Open
- See payments in real-time
- Verify subscriptions
- Check customer data

### 5. Monitor Edge Function Logs
- Real-time debugging
- See exact errors
- Track flow

---

## 🎬 Ready to Test?

```bash
✓ Authentication configured
✓ Payments configured
✓ Test cards ready
✓ Documentation available

→ Start with the 60-second quick test above
→ Then run the 10-minute full test
→ Review TESTING_GUIDE.md for comprehensive testing
```

**Go build something awesome! 🚀**
