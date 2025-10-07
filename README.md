# ForSWAGs™ - Student Athlete Recruiting Platform
## © 2025 ForSWAGs. All Rights Reserved.

> **PROPRIETARY AND CONFIDENTIAL** - This platform and all associated intellectual property are protected by copyright, trademark, patent, and trade secret laws. See [COPYRIGHT.md](COPYRIGHT.md) for full details.

## Project Overview

ForSWAGs (For Students With Athletic Goals) is a comprehensive, proprietary platform designed to help student athletes showcase their talents, connect with college recruiters, and manage their recruiting journey. The platform features innovative holistic evaluation methodologies and a tiered membership system.

## Project info

**URL**: https://lovable.dev/projects/c14147b9-3ab1-40f2-b185-b0228437210e

## Key Features

### 🎯 For Athletes
- **Profile Management**: Create comprehensive athlete profiles with stats, achievements, and media
- **Video Showcase**: Upload highlight reels and game footage (1 video on free tier, unlimited on premium)
- **College Matching**: AI-powered college matching based on academic and athletic profiles
- **Offer Tracking**: Manage and compare college offers
- **Analytics Dashboard**: Track profile views and recruiter engagement (premium feature)
- **AI Tools**: Generate social media content and press releases (premium feature)

### 🏆 For Recruiters
- **Athlete Search**: Advanced search and filtering capabilities
- **Profile Analytics**: View detailed athlete profiles and performance metrics
- **Contact Management**: Direct communication with athletes
- **Saved Searches**: Save and manage recruitment searches

### 👨‍👩‍👧 For Parents
- **Parental Consent**: Manage consent for minors (COPPA compliant)
- **Dashboard Access**: View athlete progress and offers
- **Communication**: Stay informed about recruiting activities

## Membership Tiers

### Free Tier
- ✅ Basic profile with essential fields only
- ✅ 1 video upload
- ✅ GPA only (no SAT/ACT scores)
- ✅ Access to Playbook educational content
- ✅ 200-character bio limit
- ✅ Basic college matching

### Premium Tiers

**Pro Monthly ($40/month)**
- ✅ Everything in Free
- ✅ Unlimited video uploads
- ✅ Complete profile access (SAT/ACT, athletic stats, awards)
- ✅ 1,000-character bio
- ✅ Advanced analytics dashboard
- ✅ AI-powered content generation
- ✅ Priority support
- ✅ 3x more profile views from recruiters
- ✅ Social media integration

**Championship Yearly ($260/year - Save 46%)**
- ✅ Everything in Pro Monthly
- ✅ 2 months FREE ($80 value)
- ✅ Exclusive yearly webinars
- ✅ Priority feature access
- ✅ VIP support with dedicated account manager

## Getting Started

### For Development

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c14147b9-3ab1-40f2-b185-b0228437210e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

### Frontend
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend (Lovable Cloud/Supabase)
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access control
- **Edge Functions** - Serverless backend logic
- **Authentication** - Built-in auth system
- **Storage** - File storage for media assets

### Payment Processing
- **Stripe** - Subscription and payment management
- **PayPal** - Alternative payment option

### AI Integration
- **Lovable AI** - Content generation (captions, press releases)

## System Architecture

### Database Schema
- `profiles` - User profile information
- `user_roles` - Role management (athlete, recruiter, parent, coach, admin)
- `athletes` - Athlete-specific data
- `memberships` - Subscription and tier management
- `media_assets` - Video and image storage
- `college_matches` - AI-powered college recommendations
- `college_offers` - Offer tracking
- `evaluations` - Coach evaluations
- `courses` - Educational content (Playbook)

### Key Edge Functions
- `create-checkout` - Stripe subscription checkout
- `check-subscription` - Verify membership status
- `customer-portal` - Stripe customer portal access
- `send-renewal-reminders` - Automated renewal emails (runs daily at 9 AM UTC)
- `generate-social-caption` - AI content generation
- `generate-press-release` - AI press release generation

### Membership Management
The platform enforces tier-based access control:
- **Free Tier**: Limited to 1 video, basic profile fields
- **Premium Tiers**: Full feature access
- **Login Blocking**: Expired/failed memberships cannot access the platform
- **Renewal Reminders**: Automated emails at 30, 7, and 1 day before expiration

## Security Features

### Authentication & Authorization
- Email/password authentication
- Role-based access control (RBAC)
- Row Level Security (RLS) policies on all tables
- JWT-based session management

### Data Protection
- **Minor Protection**: Enhanced privacy for athletes under 18
  - Parental consent required for public profiles
  - Social handles hidden for minors (even to paid recruiters)
  - Consent expiration tracking with renewal notifications
- **Contact Info Masking**: Only paid recruiters can view adult athlete contact details
- **Encrypted Tokens**: OAuth tokens encrypted at rest
- **Audit Logging**: All sensitive actions logged

### Compliance
- **COPPA Compliant**: Parental consent for minors
- **GDPR Ready**: Data export functionality
- **Secure File Storage**: Private buckets for sensitive documents

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c14147b9-3ab1-40f2-b185-b0228437210e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Additional Documentation

- **COPYRIGHT.md** - Comprehensive intellectual property notice and protections
- **QUICK_START.md** - 60-second testing guide
- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **SECURITY.md** - Security features and best practices
- **MEMBERSHIP_GUIDE.md** - Membership system details
- **ACCESSIBILITY.md** - Accessibility guidelines
- **MOBILE.md** - Mobile optimization details
- **PAYPAL_SETUP.md** - PayPal integration guide

## Support & Resources

- **Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **Documentation**: See individual .md files in repository
- **Issue Tracker**: Use GitHub issues for bug reports
- **Feature Requests**: Submit via GitHub discussions

## Legal & Intellectual Property

### Copyright Notice
© 2025 ForSWAGs™ (For Students With Athletic Goals). All Rights Reserved Worldwide.

This platform and all associated intellectual property, including but not limited to:
- Proprietary ranking and evaluation methodologies
- Playbook for Life® curriculum
- AI-powered college matching algorithms
- Social media generation technology
- Platform architecture and design
- All trademarks, service marks, and branding

...are protected by United States and international copyright, trademark, patent, and trade secret laws.

**UNAUTHORIZED USE IS STRICTLY PROHIBITED.**

### Enforcement Notice
ForSWAGs actively protects its intellectual property. Violations will result in civil and criminal prosecution to the fullest extent of the law, including but not limited to:
- Immediate legal action
- Statutory damages up to $150,000 per infringement
- Criminal penalties including fines and imprisonment
- Injunctive relief and attorney fee recovery

### Full Legal Notice
For complete copyright, trademark, and intellectual property information, see [COPYRIGHT.md](COPYRIGHT.md).

For IP inquiries, licensing, or to report infringement, contact our legal team with subject line "IP/Legal Inquiry".

## License

**PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED**

This project is proprietary and confidential. No license is granted for use, reproduction, modification, or distribution except as expressly provided in writing by ForSWAGs. 

See [COPYRIGHT.md](COPYRIGHT.md) for full terms.

---

⚠️ **WARNING TO COMPETITORS**: Creating a service that replicates ForSWAGs' unique concepts, methodologies, or features constitutes intellectual property theft and will be prosecuted aggressively.
