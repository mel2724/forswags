# Email Consolidation Validation Checklist

## 🎯 Purpose
This checklist ensures all email addresses across the ForSWAGs platform have been properly standardized and configured.

---

## ✅ Code Validation

### Edge Functions
- [x] `send-notification-email/index.ts` - Updated to use standardized addresses
- [x] `send-contact-email/index.ts` - Updated admin notification to `support@forswags.com`
- [x] `send-consent-renewal-emails/index.ts` - Updated error notifications to `tech@forswags.com`
- [x] `send-renewal-reminders/index.ts` - Updated error notifications to `tech@forswags.com`
- [x] `analyze-college-match/index.ts` - Updated error notifications to `tech@forswags.com`
- [x] `notify-prime-dime-ready/index.ts` - Updated to `noreply@updates.forswags.com` and `tech@forswags.com`
- [x] `request-prime-dime-analysis/index.ts` - Updated error notifications to `tech@forswags.com`
- [x] `send-waitlist-confirmation/index.ts` - Updated to `noreply@updates.forswags.com`
- [x] `transition-graduates-to-alumni/index.ts` - Already using standardized addresses
- [ ] `chat-assistant/index.ts` - Verify no email references need updating

### Frontend Components
- [x] `src/components/ErrorBoundary.tsx` - Updated to `tech@forswags.com`
- [x] `src/pages/Contact.tsx` - Updated to `support@forswags.com` and `tech@forswags.com`
- [x] `src/pages/ParentVerification.tsx` - Already using `support@forswags.com`
- [x] `src/pages/Sponsors.tsx` - Updated to `partnerships@forswags.com`
- [ ] `src/components/Footer.tsx` - Verify if exists and update
- [ ] Search for remaining `@forswags.org` references
- [ ] Search for remaining `techsupport@` references
- [ ] Search for remaining `coach@updates` references
- [ ] Search for remaining `sponsors@` references
- [ ] Search for remaining `notifications@` references

### Email Templates
- [ ] `supabase/functions/_templates/alumni_claim_profile.html`
- [ ] `supabase/functions/_templates/athlete_claim_profile.html`
- [ ] `supabase/functions/_templates/badge_earned.html`
- [ ] `supabase/functions/_templates/college_match_ready.html`
- [ ] `supabase/functions/_templates/eval_complete.html`
- [ ] `supabase/functions/_templates/eval_started.html`
- [ ] `supabase/functions/_templates/membership_renewal.html`
- [ ] `supabase/functions/_templates/payment_receipt.html`
- [ ] `supabase/functions/_templates/profile_nudge.html`
- [ ] `supabase/functions/_templates/profile_viewed.html`
- [ ] `supabase/functions/_templates/quiz_passed.html`
- [ ] `supabase/functions/_templates/ranking_updated.html`
- [ ] `supabase/functions/_templates/recruiter_daily_digest.html`
- [ ] `supabase/functions/_templates/recruiter_weekly_digest.html`
- [ ] `supabase/functions/_templates/social_post_ready.html`

### Configuration
- [x] `src/config/emailAddresses.ts` - Created with standardized addresses
- [ ] All imports updated to use `EMAIL_ADDRESSES` from config

### Documentation
- [ ] `README.md` - Update support contact information
- [ ] `QUICK_START.md` - Update email references
- [ ] `TESTING_GUIDE.md` - Update test email addresses
- [ ] `MEMBERSHIP_GUIDE.md` - Update support contact
- [ ] `PAYPAL_SETUP.md` - Update contact information
- [x] `EMAIL_MIGRATION.md` - Created with migration details

---

## 🔍 Search Commands

Run these searches to find any remaining legacy addresses:

```bash
# Search for .org domain
grep -r "support@forswags.org" src/ supabase/

# Search for legacy tech support
grep -r "techsupport@forswags.com" src/ supabase/

# Search for legacy coach address
grep -r "coach@updates.forswags.com" src/ supabase/

# Search for legacy notifications
grep -r "notifications@forswags.com" src/ supabase/

# Search for legacy sponsors
grep -r "sponsors@forswags.com" src/ supabase/

# Search for any @updates.forswags.com except noreply
grep -r "@updates.forswags.com" src/ supabase/ | grep -v "noreply@"
```

---

## 🌐 DNS & Resend Configuration

### Resend Dashboard
- [ ] Log into Resend dashboard
- [ ] Navigate to Domains section
- [ ] Add `updates.forswags.com` domain
- [ ] Copy SPF record value
- [ ] Copy DKIM record value
- [ ] Copy DMARC record value (or create custom)

### DNS Provider
- [ ] Add SPF TXT record for `updates.forswags.com`
- [ ] Add DKIM TXT record for `updates.forswags.com`
- [ ] Add DMARC TXT record for `updates.forswags.com`
- [ ] Verify records using `nslookup` or DNS checking tool
- [ ] Wait 24-48 hours for full propagation

### Resend Verification
- [ ] Return to Resend dashboard
- [ ] Click "Verify" on `updates.forswags.com` domain
- [ ] Confirm all checks pass (SPF, DKIM, DMARC)
- [ ] Domain status shows as "Verified"

---

## 📧 Email Forwarding Setup

Configure forwarding for legacy addresses (if your email provider supports it):

- [ ] `techsupport@forswags.com` → `tech@forswags.com`
- [ ] `support@forswags.org` → `support@forswags.com`
- [ ] `coach@updates.forswags.com` → `recruiting@forswags.com`
- [ ] `notifications@forswags.com` → `noreply@updates.forswags.com`
- [ ] `sponsors@forswags.com` → `partnerships@forswags.com`

---

## 🧪 Testing Protocol

### Automated Email Tests
- [ ] Trigger contact form submission
- [ ] Trigger error notification
- [ ] Trigger parent verification email
- [ ] Trigger waitlist confirmation
- [ ] Trigger membership renewal reminder
- [ ] Trigger Prime Dime notification
- [ ] Trigger college match ready notification
- [ ] Trigger alumni transition email

### Deliverability Tests
- [ ] Send test to Gmail account - check inbox/spam
- [ ] Send test to Outlook account - check inbox/spam
- [ ] Send test to Yahoo account - check inbox/spam
- [ ] Send test to custom domain - check inbox/spam
- [ ] Verify DKIM signature in email headers
- [ ] Verify SPF pass in email headers

### Manual Inbox Tests
- [ ] Send test email to `support@forswags.com` - verify receipt
- [ ] Send test email to `tech@forswags.com` - verify receipt
- [ ] Send test email to `recruiting@forswags.com` - verify receipt
- [ ] Send test email to `partnerships@forswags.com` - verify receipt
- [ ] Send test email to `admin@forswags.com` - verify receipt

### Legacy Forwarding Tests
- [ ] Send to `techsupport@forswags.com` - verify forwards to `tech@forswags.com`
- [ ] Send to `support@forswags.org` - verify forwards to `support@forswags.com`
- [ ] Send to `coach@updates.forswags.com` - verify forwards to `recruiting@forswags.com`
- [ ] Send to `sponsors@forswags.com` - verify forwards to `partnerships@forswags.com`

---

## 👥 Team Onboarding

- [ ] Share `EMAIL_MIGRATION.md` with team
- [ ] Update team email signatures
- [ ] Update team contact cards/business cards
- [ ] Train support team on new inbox structure
- [ ] Update internal documentation
- [ ] Update help desk software with new addresses
- [ ] Notify key stakeholders of changes

---

## 📊 Monitoring & Metrics

### Week 1 After Launch
- [ ] Monitor edge function logs for email errors
- [ ] Track email deliverability rate (target: >98%)
- [ ] Track bounce rate (target: <2%)
- [ ] Track spam complaint rate (target: <0.1%)
- [ ] Review error notifications being received
- [ ] Check that legacy forwarding is working

### Week 2-4
- [ ] Continue monitoring deliverability metrics
- [ ] Address any reported issues
- [ ] Verify all teams are using new addresses
- [ ] Update any missed documentation

### Day 30 Checkpoint
- [ ] Review all metrics
- [ ] Confirm no critical issues
- [ ] Send deprecation notice to team
- [ ] Prepare for legacy address removal

### Day 90 - Legacy Removal
- [ ] Disable legacy email forwarding
- [ ] Archive legacy address records
- [ ] Update deprecation status in documentation
- [ ] Final team notification

---

## 🚨 Rollback Plan

If critical issues arise:

1. **Immediate Actions**
   - [ ] Restore legacy email addresses in code
   - [ ] Re-enable old edge function configurations
   - [ ] Notify team of rollback
   - [ ] Document issues encountered

2. **Investigation**
   - [ ] Identify root cause
   - [ ] Test fixes in staging environment
   - [ ] Plan corrective actions

3. **Retry**
   - [ ] Apply fixes
   - [ ] Re-run validation checklist
   - [ ] Gradual rollout with monitoring

---

## ✅ Sign-Off

### Technical Lead
- [ ] All code changes reviewed and approved
- [ ] DNS configuration verified
- [ ] Testing completed successfully

### Operations Lead
- [ ] Email forwarding configured
- [ ] Team training completed
- [ ] Support documentation updated

### Product Owner
- [ ] Customer communication plan approved
- [ ] Timeline confirmed
- [ ] Risk assessment reviewed

---

**Validation Completed:** [Date]  
**Approved By:** [Name]  
**Document Version:** 1.0
