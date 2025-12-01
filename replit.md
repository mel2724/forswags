# ForSWAGs - Student Athlete Recruiting Platform

## Overview

ForSWAGs (For Students With Athletic Goals) is a comprehensive student-athlete development and college recruiting platform. The application helps athletes build profiles, connect with college recruiters, track offers, access educational content, and manage their athletic careers. It serves multiple user types including athletes, parents, coaches, recruiters, and administrators through a role-based system with tiered membership access.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite as the build tool

**UI Framework**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling

**State Management**: 
- React Context API for global state (AuthContext, BadgeNotificationContext, ImpersonationContext)
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks

**Routing**: React Router v6 with lazy-loaded route components to optimize bundle size

**Design System**:
- Dark athletic theme with purple primary (#9B51E0) and gold accent (#FFD623) colors
- HSL color system defined in CSS variables for theming
- Responsive mobile-first design with Progressive Web App (PWA) support
- Service worker for offline capabilities and caching

**Key Frontend Patterns**:
- Feature gating system for premium membership features
- Error boundaries for graceful error handling
- Accessibility-first approach with ARIA attributes, keyboard navigation, and screen reader support
- Custom hooks for common functionality (useFeatureAccess, useKeyboardNavigation, useFocusTrap)

### Backend Architecture

**Database**: Supabase (Postgres) with Row-Level Security (RLS) policies

**Authentication**: Supabase Auth with email/password, role-based access control (RBAC), and optional two-factor authentication

**Security Model**:
- 11-layer security system including RLS, RBAC, 2FA, audit logging, and COPPA compliance
- Minor data protection with parental consent workflows
- IP tracking and security event monitoring
- GDPR-compliant data export capabilities

**Edge Functions**: Supabase Edge Functions (Deno runtime) for:
- Email sending (Resend integration)
- AI content generation (social captions, college matching)
- Payment processing webhooks
- Scheduled tasks (cron jobs via pg_cron)
- Chat assistant functionality

**Database Design**:
- User profiles with role differentiation (athlete, parent, coach, recruiter, admin)
- Membership tiers (free, pro_monthly, championship_yearly) with feature access control
- Evaluation workflow with coach assignment and scoring
- Course/lesson structure for "Playbook for Life" educational content
- College matching algorithm with scoring criteria
- Media gallery with version history tracking
- Social media content calendar and hashtag performance tracking

### Data Storage Solutions

**Primary Database**: Supabase Postgres with:
- Row-level security policies for data isolation
- Database functions for complex business logic (membership status checks, feature access validation)
- Triggers for automated workflows (badge awarding, notification creation)
- Views for aggregated analytics (playbook video analytics, hashtag performance)

**File Storage**: Supabase Storage for:
- Profile images and avatars
- Video uploads (athlete highlights)
- Course thumbnails and lesson media
- Badge icons and certificates
- Media gallery content with versioning

**Caching Strategy**:
- TanStack Query for client-side data caching
- Service worker cache-first strategy for static assets
- Network-first with cache fallback for API requests

### Authentication & Authorization

**Authentication Flow**:
- Email/password signup with auto-confirmation (no email verification required in current setup)
- Session persistence across page reloads
- Password reset flow via Supabase Auth
- Role assignment during onboarding

**Authorization Levels**:
- **Athlete**: Profile management, evaluations, courses, college matching
- **Parent**: Child profile oversight, consent management (COPPA compliance)
- **Coach**: Evaluation assignments, scoring, feedback
- **Recruiter**: Athlete search, saved searches, profile viewing analytics
- **Admin**: Full system access, user management, content moderation

**Feature Access Control**:
- Tier-based feature gating (free vs. premium features)
- Database function `check_feature_access()` validates user permissions
- Frontend FeatureGate component enforces UI restrictions
- Premium features: unlimited videos, AI tools, advanced analytics, priority search placement

### External Dependencies

**Payment Processing**:
- **Stripe**: Subscription management (monthly/yearly memberships), evaluation purchases, customer portal
- **PayPal**: Alternative payment option (requires additional configuration)
- Promo code system for discounts
- Webhook handlers for payment events

**Email Service**:
- **Resend**: Transactional email delivery
- Email domains: `noreply@updates.forswags.com` (automated), `support@forswags.com`, `tech@forswags.com`, etc.
- Template-based emails for notifications, receipts, evaluations, and badges

**AI Services**:
- OpenAI API (implied from AI caption generation and college matching features)
- Used for: social media caption generation, college match analysis, chat assistant

**Third-Party Integrations**:
- Social media platforms (Twitter, Facebook, LinkedIn) for sharing achievements
- QR code generation for profile sharing
- Canvas Confetti for celebration animations
- HTML-to-image conversion for badge/certificate downloads

**Development Tools**:
- Vite for fast development and optimized production builds
- ESLint and TypeScript for code quality
- Tailwind CSS with PostCSS for styling
- Service worker for PWA functionality

**Monitoring & Analytics**:
- Profile view tracking (recruiter engagement metrics)
- Video analytics for educational content
- Hashtag performance tracking
- Security event logging and audit trails

**Scheduled Tasks**:
- pg_cron extension for database-level scheduling
- Email processing (consent renewals, membership reminders)
- Automated athlete selections (Athlete of the Week)
- Graduate transition to alumni status
- Social media content calendar generation