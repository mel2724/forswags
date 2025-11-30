# Supabase Migration Plan: Lovable Cloud → External Supabase Projects

**Status:** Planning Phase  
**Target Date:** TBD  
**Owner:** Development Team  
**Last Updated:** 2025-01-XX

---

## Executive Summary

Migrate from single Lovable Cloud Supabase instance to two separate external Supabase projects:
- **Sandbox Environment** (`app.forswags.com`) - Test/staging with test Stripe account
- **Production Environment** (`www.forswags.com`) - Live site with live Stripe account

**Benefits:**
- ✅ Complete data isolation between environments
- ✅ Independent Stripe configurations (test vs live)
- ✅ Separate database instances prevent cross-contamination
- ✅ Environment-specific secrets management
- ✅ Industry best practice architecture

**Trade-offs:**
- ⚠️ Lose Lovable Cloud auto-configuration convenience
- ⚠️ Manual management of two Supabase projects
- ⚠️ More complex deployment pipeline
- ⚠️ Additional cost (two Supabase projects)

---

## Phase 1: Pre-Migration Setup (Week 1)

### 1.1 Create External Supabase Projects

1. **Create Sandbox Project**
   - Go to https://supabase.com/dashboard
   - Create new project: `forswags-sandbox`
   - Region: Same as current (for performance)
   - Database Password: Generate strong password (save to 1Password/vault)
   - Tier: Free tier initially (can upgrade later)

2. **Create Production Project**
   - Create new project: `forswags-production`
   - Region: Same as sandbox
   - Database Password: Different from sandbox
   - Tier: Pro tier (recommended for production)

3. **Document Credentials**
   ```
   SANDBOX:
   - Project URL: https://xxxxx.supabase.co
   - Anon Key: eyJhbGc...
   - Service Role Key: eyJhbGc... (keep secret!)
   
   PRODUCTION:
   - Project URL: https://yyyyy.supabase.co
   - Anon Key: eyJhbGc...
   - Service Role Key: eyJhbGc... (keep secret!)
   ```

### 1.2 Export Current Schema

1. **Using Supabase CLI:**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to current Lovable Cloud project
   supabase link --project-ref fejnevxardxejdvjbipc
   
   # Generate migration from current state
   supabase db dump --schema public --data-only > data_backup.sql
   supabase db dump --schema public > schema_backup.sql
   ```

2. **Backup Critical Data:**
   - Export all tables to CSV via Supabase dashboard
   - Backup storage buckets (media-assets, profile-pictures, etc.)
   - Document all RLS policies
   - Export edge functions code (already in repo)

### 1.3 Prepare GitHub Secrets

Set up repository secrets for both environments:

**Sandbox Secrets:**
```
SANDBOX_SUPABASE_URL=https://xxxxx.supabase.co
SANDBOX_SUPABASE_ANON_KEY=eyJhbGc...
SANDBOX_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SANDBOX_STRIPE_SECRET_KEY=sk_test_...
SANDBOX_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Production Secrets:**
```
PRODUCTION_SUPABASE_URL=https://yyyyy.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=eyJhbGc...
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PRODUCTION_STRIPE_SECRET_KEY=sk_live_...
PRODUCTION_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Keep Existing Secrets:**
```
SFTP_HOST
SFTP_USER
SFTP_PASS
SANDBOX_REMOTE_DIR
PRODUCTION_REMOTE_DIR
```

---

## Phase 2: Schema Migration (Week 1-2)

### 2.1 Apply Schema to New Projects

1. **Deploy to Sandbox First:**
   ```bash
   # Connect to sandbox project
   supabase link --project-ref forswags-sandbox
   
   # Apply all migrations
   supabase db push
   
   # Or apply schema manually via SQL editor
   # Copy/paste from schema_backup.sql
   ```

2. **Verify Sandbox Schema:**
   - Check all tables exist
   - Verify RLS policies
   - Test edge functions
   - Confirm storage buckets

3. **Deploy to Production:**
   ```bash
   # Connect to production project
   supabase link --project-ref forswags-production
   
   # Apply migrations
   supabase db push
   ```

### 2.2 Storage Bucket Setup

For both projects, create buckets with correct policies:

```sql
-- Run in SQL Editor for each project

-- Media Assets (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-assets', 'media-assets', true);

-- Profile Pictures (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true);

-- Team Logos (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-logos', 'team-logos', true);

-- Playbook Videos (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('playbook-videos', 'playbook-videos', true);

-- SCORM Packages (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scorm-packages', 'scorm-packages', true);

-- Offer Documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('offer-documents', 'offer-documents', false);

-- Archived Media (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('archived-media', 'archived-media', false);

-- User Data Exports (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-data-exports', 'user-data-exports', false);
```

Apply all RLS policies from current project.

### 2.3 Edge Functions Deployment

1. **Update Edge Function Secrets** (via Supabase dashboard):
   - RESEND_API_KEY
   - STRIPE_SECRET_KEY (test for sandbox, live for production)
   - LOVABLE_API_KEY
   - INSTAGRAM_CLIENT_ID / SECRET
   - FIRECRAWL_API_KEY
   - CRON_SECRET

2. **Deploy Functions:**
   ```bash
   # For sandbox
   supabase functions deploy --project-ref forswags-sandbox
   
   # For production
   supabase functions deploy --project-ref forswags-production
   ```

---

## Phase 3: Code Updates (Week 2)

### 3.1 Update Supabase Client Configuration

**Current:** Uses Lovable Cloud auto-generated client  
**New:** Environment-aware client configuration

Create `src/integrations/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment-specific configuration
const SUPABASE_CONFIG = {
  sandbox: {
    url: import.meta.env.VITE_SUPABASE_URL_SANDBOX,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_SANDBOX,
  },
  production: {
    url: import.meta.env.VITE_SUPABASE_URL_PRODUCTION,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_PRODUCTION,
  },
};

// Determine environment based on hostname
const getEnvironment = (): 'sandbox' | 'production' => {
  if (typeof window === 'undefined') return 'sandbox';
  
  const hostname = window.location.hostname;
  if (hostname === 'www.forswags.com') return 'production';
  return 'sandbox'; // Default to sandbox for app.forswags.com, localhost, etc.
};

const env = getEnvironment();
const config = SUPABASE_CONFIG[env];

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### 3.2 Update Stripe Configuration

Update `src/lib/stripeConfig.ts`:
```typescript
// Sandbox Stripe Products (Test Mode)
const STRIPE_PRODUCTS_SANDBOX = {
  athletePro: { priceId: 'price_test_xxxxx', name: 'Pro Athlete Monthly' },
  athleteChampionship: { priceId: 'price_test_yyyyy', name: 'Championship Athlete Yearly' },
  recruiterPro: { priceId: 'price_test_zzzzz', name: 'Pro Recruiter Monthly' },
  // ... all other products with test price IDs
};

// Production Stripe Products (Live Mode)
const STRIPE_PRODUCTS_PRODUCTION = {
  athletePro: { priceId: 'price_live_xxxxx', name: 'Pro Athlete Monthly' },
  athleteChampionship: { priceId: 'price_live_yyyyy', name: 'Championship Athlete Yearly' },
  recruiterPro: { priceId: 'price_live_zzzzz', name: 'Pro Recruiter Monthly' },
  // ... all other products with live price IDs
};

// Environment detection
const getEnvironment = (): 'sandbox' | 'production' => {
  if (typeof window === 'undefined') return 'sandbox';
  const hostname = window.location.hostname;
  return hostname === 'www.forswags.com' ? 'production' : 'sandbox';
};

export const getStripeProducts = () => {
  const env = getEnvironment();
  return env === 'production' ? STRIPE_PRODUCTS_PRODUCTION : STRIPE_PRODUCTS_SANDBOX;
};

// Default export for backward compatibility
export const STRIPE_PRODUCTS = getStripeProducts();
```

### 3.3 Update GitHub Workflows

**Update `.github/workflows/deploy-sandbox.yml`:**
```yaml
name: Deploy to Sandbox (app.forswags.com)
on:
  push:
    branches: [ "sandbox" ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Create .env file for sandbox
        run: |
          echo "VITE_SUPABASE_URL_SANDBOX=${{ secrets.SANDBOX_SUPABASE_URL }}" > .env
          echo "VITE_SUPABASE_ANON_KEY_SANDBOX=${{ secrets.SANDBOX_SUPABASE_ANON_KEY }}" >> .env
          echo "VITE_SUPABASE_URL_PRODUCTION=${{ secrets.PRODUCTION_SUPABASE_URL }}" >> .env
          echo "VITE_SUPABASE_ANON_KEY_PRODUCTION=${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}" >> .env

      - run: npm ci
      - run: npm run build

      - name: Deploy to Sandbox via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USER }}
          password: ${{ secrets.SFTP_PASS }}
          server-dir: ${{ secrets.SANDBOX_REMOTE_DIR }}
          local-dir: ./dist/
          dangerous-clean-slate: true
```

**Update `.github/workflows/deploy-production.yml`:**
```yaml
name: Deploy to Production (www.forswags.com)
on:
  workflow_dispatch:
    inputs:
      confirmation:
        description: 'Type "deploy" to confirm production deployment'
        required: true
        default: ''
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate confirmation
        run: |
          if [ "${{ github.event.inputs.confirmation }}" != "deploy" ]; then
            echo "❌ Deployment cancelled. You must type 'deploy' to confirm."
            exit 1
          fi
          echo "✅ Confirmation received. Proceeding with production deployment..."
      
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Create .env file for production
        run: |
          echo "VITE_SUPABASE_URL_SANDBOX=${{ secrets.SANDBOX_SUPABASE_URL }}" > .env
          echo "VITE_SUPABASE_ANON_KEY_SANDBOX=${{ secrets.SANDBOX_SUPABASE_ANON_KEY }}" >> .env
          echo "VITE_SUPABASE_URL_PRODUCTION=${{ secrets.PRODUCTION_SUPABASE_URL }}" >> .env
          echo "VITE_SUPABASE_ANON_KEY_PRODUCTION=${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}" >> .env

      - run: npm ci
      - run: npm run build

      - name: Deploy to Production via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USER }}
          password: ${{ secrets.SFTP_PASS }}
          server-dir: ${{ secrets.PRODUCTION_REMOTE_DIR }}
          local-dir: ./dist/
          dangerous-clean-slate: true
```

---

## Phase 4: Data Migration (Week 2-3)

### 4.1 Sandbox Data Migration

1. **Seed with Test Data:**
   - Create test user accounts
   - Upload sample media files
   - Generate test athletes, profiles, evaluations
   - **DO NOT** migrate production user data to sandbox

2. **Test Stripe Integration:**
   - Configure test Stripe products
   - Test checkout flows with test cards (4242 4242 4242 4242)
   - Verify webhooks

### 4.2 Production Data Migration

⚠️ **CRITICAL: Plan for downtime or read-only mode**

1. **Pre-Migration Checklist:**
   - [ ] Announce maintenance window to users (email, banner)
   - [ ] Set site to read-only mode (optional)
   - [ ] Create final backup of Lovable Cloud database
   - [ ] Verify backup integrity

2. **Data Export from Lovable Cloud:**
   ```bash
   # Export all data
   supabase db dump --data-only --use-copy > production_data.sql
   
   # Export storage files
   # Use Supabase CLI or dashboard to download all buckets
   ```

3. **Data Import to Production Project:**
   ```bash
   # Link to production project
   supabase link --project-ref forswags-production
   
   # Import data
   psql $PRODUCTION_DB_URL < production_data.sql
   
   # Upload storage files
   # Use Supabase CLI or dashboard to upload to respective buckets
   ```

4. **Verify Data Integrity:**
   - Count records in each table (should match Lovable Cloud)
   - Verify user authentication works
   - Check file uploads are accessible
   - Test critical user flows

---

## Phase 5: Testing & Validation (Week 3)

### 5.1 Sandbox Testing

**Test Checklist:**
- [ ] User registration/login works
- [ ] Profile creation and updates
- [ ] Media upload to all buckets
- [ ] Stripe test checkout (4242 4242 4242 4242)
- [ ] Edge functions execute correctly
- [ ] Email notifications send
- [ ] College matching functionality
- [ ] Admin panel access
- [ ] Coach evaluation workflow
- [ ] Recruiter search functionality

### 5.2 Production Smoke Tests

⚠️ **Test with REAL small transactions first**

- [ ] User can log in with existing credentials
- [ ] Profile data displays correctly
- [ ] Media files load properly
- [ ] Create one real Stripe payment (small amount, refund after)
- [ ] Verify webhook handling
- [ ] Test critical user paths

### 5.3 Performance Testing

- [ ] Page load times comparable to Lovable Cloud
- [ ] Database query performance
- [ ] File upload/download speeds
- [ ] Edge function latency

---

## Phase 6: Go-Live (Week 4)

### 6.1 Pre-Launch Checklist

- [ ] All tests passing on both environments
- [ ] GitHub secrets configured correctly
- [ ] Stripe webhooks configured for production
- [ ] DNS settings reviewed (ensure pointing to correct servers)
- [ ] Backup/restore procedures documented
- [ ] Rollback plan ready
- [ ] Team briefed on new architecture

### 6.2 Deployment Sequence

1. **Deploy Sandbox First:**
   ```bash
   git checkout sandbox
   git merge main
   git push origin sandbox
   # Auto-deploys to app.forswags.com
   ```

2. **Final Sandbox Validation:**
   - Perform full regression test
   - Verify environment detection works
   - Test Stripe test mode

3. **Deploy Production:**
   - Go to GitHub Actions
   - Select "Deploy to Production" workflow
   - Click "Run workflow"
   - Type "deploy" to confirm
   - Monitor deployment logs

4. **Post-Deployment Verification:**
   - Test www.forswags.com loads correctly
   - Verify production Supabase connection
   - Test user login
   - Verify live Stripe payments work
   - Monitor error logs

### 6.3 Monitoring (First 48 Hours)

**Watch for:**
- Supabase error rates (dashboard → Logs)
- Stripe webhook failures
- User-reported issues
- Performance degradation
- Edge function errors

**Set up alerts:**
- Supabase dashboard → Alerts
- Stripe dashboard → Webhooks → Monitor
- GitHub Actions → Email notifications

---

## Phase 7: Post-Migration (Week 4+)

### 7.1 Disconnect from Lovable Cloud

⚠️ **Only after confirming everything works on external Supabase**

1. In Lovable editor: Settings → Integrations → Lovable Cloud
2. Consider implications before disabling (cannot re-enable easily)
3. Keep Lovable Cloud active for 1-2 weeks as safety net
4. Once stable, can disable if desired

### 7.2 Documentation Updates

- [ ] Update README.md with new Supabase setup
- [ ] Document environment variable requirements
- [ ] Update deployment instructions
- [ ] Create runbook for common operations
- [ ] Document rollback procedures

### 7.3 Team Training

- [ ] Train team on two-environment workflow
- [ ] Document when to use sandbox vs production
- [ ] Establish promotion process (sandbox → production)
- [ ] Set up code review requirements for production

---

## Rollback Plan

### If Migration Fails

**Scenario 1: Schema Migration Issues**
- Stop deployment
- Fix schema errors in migration files
- Re-run migrations
- Continue from failed step

**Scenario 2: Data Migration Issues**
- Keep Lovable Cloud active (DO NOT DELETE)
- Point users back to Lovable Cloud temporarily
- Investigate data integrity issues
- Re-attempt migration with fixes

**Scenario 3: Production Deployment Fails**
- Production site still points to Lovable Cloud
- Debug issues in sandbox environment
- Fix and re-test before attempting production again

**Emergency Rollback Steps:**
1. Revert GitHub workflows to use Lovable Cloud credentials
2. Rebuild and redeploy with old configuration
3. Users continue using existing Lovable Cloud database
4. Investigate and fix issues before reattempting

---

## Cost Analysis

### Current (Lovable Cloud)
- Lovable Cloud: Included in Lovable subscription
- Total: $0 additional (beyond Lovable subscription)

### After Migration

**Supabase Costs:**
- Sandbox (Free Tier): $0/month
  - 500MB database
  - 1GB storage
  - 2GB bandwidth
  - Sufficient for testing

- Production (Pro Tier): ~$25/month
  - 8GB database
  - 100GB storage
  - 250GB bandwidth
  - Point-in-time recovery
  - Daily backups
  - **Or** stay on Free Tier initially if usage is low

**Additional Costs:**
- None (GitHub Actions, Namecheap hosting already covered)

**Total Additional Cost: $0-25/month**

---

## Risk Assessment

### High Risks
1. **Data Loss During Migration**
   - Mitigation: Multiple backups, incremental migration, thorough testing
   
2. **Extended Downtime**
   - Mitigation: Plan maintenance window, practice migration in sandbox first

3. **Stripe Integration Issues**
   - Mitigation: Test thoroughly in sandbox, have test transactions in production

### Medium Risks
1. **Performance Degradation**
   - Mitigation: Same region selection, monitor closely post-launch
   
2. **User Confusion**
   - Mitigation: Clear communication, status page

3. **Environment Configuration Errors**
   - Mitigation: Automated deployment scripts, validation steps

### Low Risks
1. **GitHub Actions Failures**
   - Mitigation: Test workflows thoroughly, manual deployment option available

---

## Success Criteria

✅ Migration is successful when:
- [ ] Both environments deployed and stable
- [ ] All existing features work identically
- [ ] Stripe integration working (test + live)
- [ ] No data loss
- [ ] Performance meets or exceeds current
- [ ] Team comfortable with new workflow
- [ ] Zero production incidents for 1 week

---

## Timeline Summary

| Week | Phase | Key Activities |
|------|-------|----------------|
| 1 | Setup | Create Supabase projects, export schema, configure secrets |
| 1-2 | Schema Migration | Deploy schema to both projects, configure storage, deploy edge functions |
| 2 | Code Updates | Update client configuration, Stripe config, GitHub workflows |
| 2-3 | Data Migration | Seed sandbox with test data, migrate production data |
| 3 | Testing | Comprehensive testing on both environments |
| 4 | Go-Live | Deploy to production, monitor closely |
| 4+ | Post-Migration | Documentation, training, optimization |

**Total Duration: 4-6 weeks** (depending on data volume and testing thoroughness)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Schedule migration** - pick low-traffic period
3. **Create Supabase projects** (sandbox first)
4. **Start Phase 1** - export schema and data
5. **Set up GitHub secrets** before code changes
6. **Test in sandbox** extensively before production

---

## Questions to Answer Before Starting

- [ ] What is the acceptable downtime window for production migration?
- [ ] Do we have Stripe live account ready with products created?
- [ ] Who will be responsible for monitoring post-migration?
- [ ] Do we have backup communication channel if site goes down?
- [ ] What is our rollback decision criteria?

---

## Support & Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase CLI Guide: https://supabase.com/docs/guides/cli
- Stripe Migration Guide: https://stripe.com/docs/testing
- GitHub Actions Docs: https://docs.github.com/actions

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Next Review:** After Phase 1 completion
