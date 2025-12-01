/**
 * Centralized Email Address Configuration for ForSWAGs Platform
 * 
 * DOMAIN STRUCTURE:
 * - forswags.com: Human-facing inboxes (support, tech, recruiting, partnerships)
 * - updates.forswags.com: Transactional/automated system emails (Resend)
 * - news.forswags.com: Reserved for future marketing (not active)
 * 
 * DNS REQUIREMENTS:
 * - updates.forswags.com must be verified in Resend with SPF, DKIM, DMARC records
 * - forswags.com retains its own mail records for human addresses
 * 
 * LEGACY MIGRATION:
 * All legacy addresses below should forward to their modern equivalents.
 * Deprecation timeline: 90 days from implementation date.
 */

export const EMAIL_ADDRESSES = {
  /**
   * FROM ADDRESSES
   * Used in email headers when sending automated messages
   * All transactional emails MUST use updates.forswags.com subdomain
   */
  from: {
    /** Primary sender for all automated system emails, receipts, notifications */
    noreply: 'ForSWAGs <noreply@updates.forswags.com>',
    
    /** Support team responses (when sending from support inbox) */
    support: 'ForSWAGs Support <support@forswags.com>',
    
    /** Recruiting team responses for athlete inquiries */
    recruiting: 'ForSWAGs Recruiting <recruiting@forswags.com>',
    
    /** Partnership/sponsor correspondence */
    partnerships: 'ForSWAGs Partnerships <partnerships@forswags.com>',
  },
  
  /**
   * TO ADDRESSES
   * Where emails are received and monitored by team
   * All use primary forswags.com domain
   */
  to: {
    /** General customer support, player/parent inquiries */
    support: 'support@forswags.com',
    
    /** Technical errors, platform issues, dev notifications */
    tech: 'tech@forswags.com',
    
    /** Athlete submissions, recruiter responses */
    recruiting: 'recruiting@forswags.com',
    
    /** Sponsor inquiries, business partnerships */
    partnerships: 'partnerships@forswags.com',
    
    /** Internal system notifications, admin alerts */
    admin: 'admin@forswags.com',
  },
  
  /**
   * LEGACY ADDRESSES (DEPRECATED)
   * These addresses should forward to their modern equivalents
   * Deprecation date: 90 days from implementation
   * 
   * Migration mapping:
   * - techsupport@forswags.com → tech@forswags.com
   * - support@forswags.org → support@forswags.com
   * - coach@updates.forswags.com → recruiting@forswags.com
   * - notifications@forswags.com → noreply@updates.forswags.com
   * - sponsors@forswags.com → partnerships@forswags.com
   */
  legacy: {
    techSupport: 'techsupport@forswags.com',
    supportOrg: 'support@forswags.org',
    coachUpdates: 'coach@updates.forswags.com',
    notificationsOld: 'notifications@forswags.com',
    sponsorsOld: 'sponsors@forswags.com',
  },
} as const;

/**
 * Type definitions for type-safe email address usage
 */
export type EmailFromAddress = typeof EMAIL_ADDRESSES.from[keyof typeof EMAIL_ADDRESSES.from];
export type EmailToAddress = typeof EMAIL_ADDRESSES.to[keyof typeof EMAIL_ADDRESSES.to];

/**
 * Helper function to get email address without display name
 * Example: "ForSWAGs <noreply@updates.forswags.com>" → "noreply@updates.forswags.com"
 */
export function extractEmailAddress(fullAddress: string): string {
  const match = fullAddress.match(/<(.+?)>/);
  return match ? match[1] : fullAddress;
}

/**
 * RESEND CONFIGURATION CHECKLIST
 * 
 * Before deployment, ensure:
 * ✅ updates.forswags.com domain verified in Resend
 * ✅ DNS records added (SPF, DKIM, DMARC)
 * ✅ Test email sent successfully from noreply@updates.forswags.com
 * ✅ Legacy email forwarding configured
 * ✅ Team access configured for support@, tech@, recruiting@, partnerships@
 */
