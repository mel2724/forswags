# Security Features Documentation

This document outlines the comprehensive security features implemented in the ForSWAGs application.

## Overview

ForSWAGs implements multiple layers of security including two-factor authentication, activity logging, role-based access control auditing, and GDPR-compliant data export functionality.

## Features Implemented

### 1. Two-Factor Authentication (2FA) 🔐

**Location**: `/security` → Two-Factor Auth tab

**Features:**
- TOTP-based authentication using authenticator apps
- QR code generation for easy setup
- 10 backup codes for emergency access
- Enable/disable 2FA at any time
- Audit logging of 2FA status changes

**How to Use:**
1. Navigate to Security Settings
2. Click "Enable Two-Factor Authentication"
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code to verify
5. Save your backup codes in a secure location
6. 2FA will be required on next login

**Supported Authenticator Apps:**
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Any TOTP-compatible app

**Backup Codes:**
- 10 one-time use codes generated
- Use if you lose access to your authenticator
- Each code can only be used once
- Generate new codes if you've used them all

**Implementation Details:**
```typescript
// Supabase Auth MFA methods used:
- supabase.auth.mfa.enroll() // Start enrollment
- supabase.auth.mfa.challengeAndVerify() // Verify code
- supabase.auth.mfa.unenroll() // Disable 2FA
- supabase.auth.mfa.listFactors() // Check status
```

### 2. Activity Logs 📋

**Location**: `/security` → Activity Log tab

**Tracked Actions:**
- User logins and logouts
- Profile updates
- Settings changes
- 2FA enable/disable events
- Role changes
- Data export requests
- Failed login attempts
- Unauthorized access attempts

**Log Details Include:**
- Timestamp of action
- Action type
- Resource affected
- IP address (when available)
- User agent information
- Additional metadata

**Retention:**
- Logs are retained indefinitely
- Admins can view all logs
- Users can view their own logs
- Last 50 logs displayed by default

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

**Usage in Code:**
```typescript
import { useAuditLog } from '@/hooks/useAuditLog';

const { logAction } = useAuditLog();

await logAction({
  action: "profile_update",
  resourceType: "profile",
  resourceId: userId,
  metadata: { changes: ["email", "name"] }
});
```

### 3. Role-Based Access Control (RBAC) Audit 🛡️

**Location**: `/security` → Security Audit tab (Admin only)

**Features:**
- Overview of all users and their roles
- Total audit log count
- Sensitive actions counter
- Recent security alerts (last 24 hours)
- User role distribution

**Metrics Tracked:**
- Total audit logs
- Sensitive actions (role changes, MFA changes, etc.)
- Recent security alerts
- User count by role

**Roles Available:**
- **Admin**: Full access to all features
- **Moderator**: Limited administrative access
- **Coach**: Access to evaluation features
- **Recruiter**: Access to athlete search
- **Athlete**: Standard user access
- **Parent**: Access to child athlete profiles

**Security Considerations:**
- Roles stored in separate `user_roles` table
- Never stored in localStorage or cookies
- Server-side validation on all operations
- RLS policies enforce role-based access
- Audit trail for all role changes

**Database Schema:**
```sql
CREATE TYPE app_role AS ENUM (
  'admin', 'moderator', 'coach', 
  'recruiter', 'athlete', 'parent'
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
```

**Helper Function:**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4. GDPR Data Export 📦

**Location**: `/security` → Data Export tab

**Features:**
- Request complete data export
- Exports all user-related data
- JSON format download
- 7-day expiration on export files
- Export history tracking
- Processing status updates

**Data Included in Export:**
1. **User Information**
   - Account details
   - Email and profile data
   - Account creation date

2. **Profile Data**
   - All profile fields
   - Settings and preferences

3. **Athletes Data**
   - Athletic profiles
   - Stats and achievements
   - Recruiting information

4. **Media Assets**
   - Uploaded images/videos metadata
   - Links to stored files

5. **Evaluations**
   - Purchase history
   - Completed evaluations
   - Coach feedback

6. **Activity Logs**
   - Last 1000 audit logs
   - Login history

7. **Notifications**
   - All notifications received

8. **Memberships**
   - Subscription history
   - Payment records

**Export Process:**
1. User requests export via UI
2. Request created with "processing" status
3. Edge function collects all data
4. Data compiled into JSON format
5. Export URL generated (data URI or storage link)
6. User notified when ready
7. Download link expires after 7 days

**API Endpoint:**
```
POST /functions/v1/export-user-data
Authorization: Bearer <user_token>

Response:
{
  "success": true,
  "export_id": "uuid",
  "message": "Data export completed"
}
```

**Database Schema:**
```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Security Best Practices

### Password Security
- Minimum 8 characters
- Requires uppercase, lowercase, numbers
- Password strength meter
- Leaked password protection (enable in auth settings)
- Password reset via email

### Session Management
- Secure session tokens
- Automatic logout after inactivity
- Refresh token rotation
- Secure cookie settings

### Data Protection
- All data encrypted at rest
- TLS/SSL for data in transit
- Row-Level Security (RLS) on all tables
- Parameterized queries prevent SQL injection

### Access Control
- Role-based permissions
- Service-level authentication
- API rate limiting
- CORS configuration

### Audit Trail
- All sensitive actions logged
- IP address tracking
- User agent logging
- Timestamp for all events

## Admin Security Tasks

### Regular Security Reviews
- Review activity logs weekly
- Check for unusual access patterns
- Monitor failed login attempts
- Audit role assignments monthly

### User Management
- Remove inactive accounts
- Review admin/moderator roles
- Validate email addresses
- Monitor export requests

### Incident Response
1. Identify security incident
2. Review audit logs for scope
3. Disable affected accounts if needed
4. Reset credentials if compromised
5. Document incident
6. Implement preventive measures

## Compliance

### GDPR Compliance
- ✅ Right to access (data export)
- ✅ Right to erasure (account deletion)
- ✅ Right to rectification (profile editing)
- ✅ Right to restrict processing
- ✅ Right to data portability (JSON export)
- ✅ Right to object
- ✅ Rights related to automated decision making

### Data Retention
- Activity logs: Indefinite
- Export files: 7 days
- Backup codes: Until used or regenerated
- Session tokens: 1 hour (access) / 30 days (refresh)

### Privacy Policy
Users should be informed about:
- What data is collected
- How data is used
- Who has access to data
- How long data is retained
- Rights under GDPR
- How to contact privacy team

## Troubleshooting

### 2FA Issues

**Problem**: Lost authenticator device

**Solution**:
1. Use one of your backup codes to login
2. Go to Security Settings
3. Disable 2FA
4. Re-enable 2FA with new device
5. Save new backup codes

---

**Problem**: QR code not scanning

**Solution**:
1. Try manual entry code (shown below QR)
2. Ensure authenticator app is updated
3. Check device camera permissions
4. Try different authenticator app

### Activity Log Issues

**Problem**: Actions not appearing in log

**Solution**:
1. Logs may take a few seconds to appear
2. Refresh the page
3. Check if action actually completed
4. Verify RLS policies allow reading

### Data Export Issues

**Problem**: Export stuck in "processing"

**Solution**:
1. Wait 5-10 minutes for large accounts
2. Check edge function logs for errors
3. Try requesting export again
4. Contact admin if problem persists

---

**Problem**: Export link expired

**Solution**:
1. Export links expire after 7 days
2. Request a new export
3. Download immediately when ready
4. Save file locally for records

## API Reference

### Log Audit Event
```typescript
// Function call
const logId = await supabase.rpc('log_audit_event', {
  p_action: 'user_action',
  p_resource_type: 'resource',
  p_resource_id: 'uuid',
  p_metadata: { key: 'value' }
});
```

### Check User Role
```typescript
// SQL function
SELECT has_role(auth.uid(), 'admin'::app_role);

// In RLS policy
CREATE POLICY "policy_name" ON table_name
FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

### Request Data Export
```typescript
const { data } = await supabase.functions.invoke('export-user-data');
```

## Future Enhancements

Planned security improvements:
- [ ] Biometric authentication (fingerprint/Face ID)
- [ ] Hardware security key support (YubiKey, etc.)
- [ ] Advanced threat detection
- [ ] Anomaly detection in activity logs
- [ ] Automated security reports
- [ ] Real-time security alerts
- [ ] IP whitelisting
- [ ] Geographic access restrictions
- [ ] Session management dashboard
- [ ] Password history (prevent reuse)
- [ ] Account recovery options
- [ ] Security questions
- [ ] SMS-based 2FA alternative

## Support

For security issues or questions:
- Email: security@forswags.com
- In-app: Security Settings → Help
- Documentation: https://docs.forswags.com/security

**Report Security Vulnerabilities:**
Please report security vulnerabilities responsibly via email to security@forswags.com. Do not create public issues for security vulnerabilities.

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
