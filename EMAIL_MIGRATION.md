# ForSWAGs Email Address Migration Guide

**Implementation Date:** [Date TBD]  
**Deprecation Timeline:** 90 days from implementation

---

## 📧 Email Address Changes

### New Standardized Email Structure

All ForSWAGs emails now follow a unified domain structure for better organization, deliverability, and professionalism.

#### **Primary Domains:**
- **forswags.com** - Human-facing inboxes (support, tech, recruiting, partnerships)
- **updates.forswags.com** - Transactional/automated system emails (via Resend)

---

## 🔄 Migration Mapping

### Legacy → Modern Address Migration

| **Legacy Address** | **Modern Address** | **Purpose** | **Status** |
|-------------------|-------------------|------------|------------|
| `techsupport@forswags.com` | `tech@forswags.com` | Technical errors, platform issues, dev notifications | ⚠️ Deprecated |
| `support@forswags.org` | `support@forswags.com` | General customer support, player/parent inquiries | ⚠️ Deprecated |
| `coach@updates.forswags.com` | `recruiting@forswags.com` | Athlete submissions, recruiter responses | ⚠️ Deprecated |
| `notifications@forswags.com` | `noreply@updates.forswags.com` | All automated system emails, receipts, notifications | ⚠️ Deprecated |
| `sponsors@forswags.com` | `partnerships@forswags.com` | Sponsor inquiries, business partnerships | ⚠️ Deprecated |

---

## ✅ New Email Addresses

### **Transactional (Automated)**
- **`noreply@updates.forswags.com`**
  - All automated messages, receipts, verifications, and notifications
  - Configured via Resend with SPF/DKIM/DMARC
  - DO NOT reply to this address

### **Support & Operations**
- **`support@forswags.com`**
  - General customer support
  - Player/parent inquiries
  - Account assistance
  - Response time: Within 24 hours

- **`tech@forswags.com`**
  - Platform error logs
  - Technical issues
  - Developer notifications
  - Internal technical team only

- **`recruiting@forswags.com`**
  - Athlete submissions
  - Recruiter responses
  - Scouting inquiries
  - College coach communication

- **`partnerships@forswags.com`**
  - Sponsor inquiries
  - Business collaborations
  - Partnership proposals
  - Advertising opportunities

- **`admin@forswags.com`**
  - Internal system notifications
  - Admin alerts
  - Platform-wide announcements
  - Internal use only

---

## 🔧 Technical Implementation

### **Resend Configuration**

#### Domain Setup
1. Verify `updates.forswags.com` domain in Resend dashboard
2. Add DNS records provided by Resend:
   - **SPF Record** - Authorizes Resend to send on behalf of domain
   - **DKIM Record** - Adds cryptographic signature to emails
   - **DMARC Record** - Defines policy for handling suspicious emails

#### DNS Records Required
```
Type: TXT
Name: updates.forswags.com
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey.updates.forswags.com
Value: [Provided by Resend]

Type: TXT
Name: _dmarc.updates.forswags.com
Value: v=DMARC1; p=none; rua=mailto:tech@forswags.com
```

### **Email Forwarding Rules**

Configure email forwarding for legacy addresses (90-day transition period):

| **From (Legacy)** | **Forward To (Modern)** |
|------------------|----------------------|
| techsupport@forswags.com | tech@forswags.com |
| support@forswags.org | support@forswags.com |
| coach@updates.forswags.com | recruiting@forswags.com |
| notifications@forswags.com | noreply@updates.forswags.com |
| sponsors@forswags.com | partnerships@forswags.com |

---

## 📝 Code Changes Summary

### **Files Modified:**

#### Edge Functions (10 files)
1. `supabase/functions/send-notification-email/index.ts`
   - Updated "from" address to `noreply@updates.forswags.com`
   - Updated error notifications to `tech@forswags.com`
   - Updated footer support email to `support@forswags.com`

2. `supabase/functions/send-contact-email/index.ts`
   - Updated admin notification to `support@forswags.com`

3. `supabase/functions/send-consent-renewal-emails/index.ts`
   - Updated error notifications to `tech@forswags.com`

4. `supabase/functions/send-renewal-reminders/index.ts`
   - Updated error notifications to `tech@forswags.com`

5. `supabase/functions/analyze-college-match/index.ts`
   - Updated error notifications to `tech@forswags.com`

6. `supabase/functions/notify-prime-dime-ready/index.ts`
   - Updated "from" address to `noreply@updates.forswags.com`
   - Updated error notifications to `tech@forswags.com`

7. `supabase/functions/request-prime-dime-analysis/index.ts`
   - Updated error notifications to `tech@forswags.com`

8. `supabase/functions/send-waitlist-confirmation/index.ts`
   - Updated "from" address to `noreply@updates.forswags.com`

9. `supabase/functions/transition-graduates-to-alumni/index.ts`
   - Already using standardized addresses

10. `supabase/functions/chat-assistant/index.ts`
    - Verify consistency with new email structure

#### Frontend Components (5 files)
1. `src/components/ErrorBoundary.tsx`
   - Updated technical support email to `tech@forswags.com`

2. `src/pages/Contact.tsx`
   - Updated email support to `support@forswags.com`
   - Updated technical support to `tech@forswags.com`

3. `src/pages/ParentVerification.tsx`
   - Already using `support@forswags.com`

4. `src/pages/Sponsors.tsx`
   - Updated sponsor contact to `partnerships@forswags.com`

5. `src/pages/Footer.tsx` (if exists)
   - Verify all footer email references are updated

#### Configuration File
- `src/config/emailAddresses.ts` (NEW)
  - Centralized email configuration
  - TypeScript type safety
  - Single source of truth for all email addresses

---

## ✅ Post-Implementation Checklist

### **DNS Configuration**
- [ ] Verify `updates.forswags.com` domain in Resend
- [ ] Add SPF record to DNS
- [ ] Add DKIM record to DNS
- [ ] Add DMARC record to DNS
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Test DNS configuration using MXToolbox or similar

### **Email Forwarding**
- [ ] Set up forwarding: `techsupport@forswags.com` → `tech@forswags.com`
- [ ] Set up forwarding: `support@forswags.org` → `support@forswags.com`
- [ ] Set up forwarding: `coach@updates.forswags.com` → `recruiting@forswags.com`
- [ ] Set up forwarding: `notifications@forswags.com` → `noreply@updates.forswags.com`
- [ ] Set up forwarding: `sponsors@forswags.com` → `partnerships@forswags.com`
- [ ] Test each forwarding rule

### **Email Testing**
- [ ] Send test email from `noreply@updates.forswags.com`
- [ ] Verify email lands in inbox (not spam)
- [ ] Check DKIM/SPF signatures in email headers
- [ ] Test reply-to behavior
- [ ] Verify email template rendering
- [ ] Test error notification delivery to `tech@forswags.com`

### **Team Access**
- [ ] Configure `support@forswags.com` inbox access
- [ ] Configure `tech@forswags.com` inbox access
- [ ] Configure `recruiting@forswags.com` inbox access
- [ ] Configure `partnerships@forswags.com` inbox access
- [ ] Configure `admin@forswags.com` inbox access
- [ ] Set up email client access (IMAP/SMTP)
- [ ] Train team on new email structure

### **Documentation**
- [ ] Update all public-facing documentation
- [ ] Update internal team documentation
- [ ] Update help center/FAQ references
- [ ] Notify customers of email changes (if necessary)
- [ ] Update email signatures

### **Monitoring**
- [ ] Monitor error logs for missed email references
- [ ] Track email deliverability rates
- [ ] Monitor spam reports
- [ ] Check bounce rates
- [ ] Set up alerts for delivery failures

---

## 🚨 Troubleshooting

### **Email Not Sending**
1. Verify Resend API key is configured correctly
2. Check DNS propagation status
3. Verify domain is verified in Resend dashboard
4. Check edge function logs for errors

### **Email Going to Spam**
1. Verify SPF, DKIM, DMARC records are correct
2. Check email content for spam triggers
3. Warm up new sending domain gradually
4. Monitor sender reputation

### **Legacy Emails Not Forwarding**
1. Verify forwarding rules are active
2. Check spam/junk folders
3. Test with different email providers
4. Check email server logs

---

## 📅 Deprecation Schedule

| **Date** | **Action** |
|---------|-----------|
| Day 0 | New email addresses go live |
| Day 1-30 | Monitor forwarding and deliverability |
| Day 30 | Send deprecation notice to team |
| Day 60 | Final reminder about legacy address removal |
| Day 90 | **Disable all legacy email addresses** |
| Day 90+ | Only modern addresses remain active |

---

## 📞 Support

For questions or issues during the migration:
- **Technical Issues:** tech@forswags.com
- **General Support:** support@forswags.com
- **Internal Team:** Slack #tech-team channel

---

**Last Updated:** [Date]  
**Document Version:** 1.0  
**Owner:** Technical Team
