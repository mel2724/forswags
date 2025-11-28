# Working with ForSWAGs in Claude Code

## Overview
The ForSWAGs platform has been migrated from Lovable to work independently in Claude Code. This document explains how to work with the project in this new environment.

---

## What Changed

### Removed from Project:
- ✅ `lovable-tagger` package removed from dependencies
- ✅ Lovable-specific imports removed from `vite.config.ts`
- ✅ Lovable project URL references updated
- ✅ Documentation updated to reflect Claude Code workflow

### What Still Works:
- ✅ Complete React/TypeScript application
- ✅ Supabase integration and authentication
- ✅ All pages, components, and features
- ✅ Build process (`npm run build`)
- ✅ Development server (`npm run dev`)
- ✅ Edge functions in Supabase

---

## How to Edit the Site

### Option 1: Ask Claude Code (Recommended)
Simply tell Claude what you want to change:

**Examples:**
- "Change the primary color to blue"
- "Add a new field to the athlete profile page"
- "Fix the padding on the header"
- "Create a new component for displaying stats"

Claude will:
1. Locate the relevant files
2. Make the changes
3. Verify the changes work
4. Explain what was modified

### Option 2: View and Request Edits
You can request Claude to show you specific files, then ask for edits:

**Example workflow:**
```
You: "Show me the Membership page"
Claude: [Shows /src/pages/Membership.tsx]
You: "Change the monthly price from $40 to $49"
Claude: [Makes the edit]
```

---

## Project Structure

```
/tmp/cc-agent/60779384/project/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Main page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── contexts/         # React context providers
│   └── integrations/     # Supabase client setup
├── supabase/
│   ├── functions/        # Edge functions (serverless)
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── package.json          # Dependencies

Key Files:
- .env                    # Environment variables
- vite.config.ts         # Build configuration
- tailwind.config.ts     # Styling configuration
```

---

## Common Tasks

### Starting the Development Server
```bash
npm run dev
```
Server runs on `http://localhost:8080`

### Building for Production
```bash
npm run build
```
Output goes to `dist/` folder

### Running Linter
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

---

## Making Changes

### Styling Changes
- Most components use Tailwind CSS classes
- Custom styles are in `src/index.css`
- Theme colors defined in `tailwind.config.ts`

**Example request:**
"Make the buttons larger on the membership page"

### Adding New Features
**Example request:**
"Add a search bar to the athletes page that filters by name"

Claude will:
1. Create or modify necessary components
2. Add state management if needed
3. Update types if using TypeScript
4. Test that it compiles

### Fixing Bugs
**Example request:**
"The subscribe button doesn't work when I click it"

Claude will:
1. Investigate the relevant code
2. Identify the issue
3. Implement a fix
4. Verify it works

---

## Environment Variables

Located in `.env` file:

```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

**To add new environment variables:**
1. Add to `.env` file with `VITE_` prefix
2. Access in code: `import.meta.env.VITE_YOUR_VAR`
3. Restart dev server after changes

---

## Supabase Configuration

### Database
- Schema defined in `supabase/migrations/`
- Access via `supabase` client in `src/integrations/supabase/client.ts`

### Edge Functions
- Located in `supabase/functions/`
- Deploy through Supabase dashboard or CLI
- Environment variables set in Supabase project settings

---

## Testing Your Changes

### 1. Visual Changes
```bash
npm run dev
```
Navigate to affected page and verify

### 2. Build Verification
```bash
npm run build
```
Ensures no TypeScript or build errors

### 3. Feature Testing
- Create test accounts as needed
- Follow flows end-to-end
- Check browser console for errors

---

## Troubleshooting

### Build Fails
**Error:** Module not found
**Fix:** Check import paths, ensure files exist

**Error:** Type errors
**Fix:** Ask Claude to fix TypeScript errors

### Dev Server Won't Start
**Check:**
- Port 8080 not already in use
- `node_modules` installed (`npm install`)
- No syntax errors in config files

### Changes Not Appearing
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Restart dev server

---

## Key Differences from Lovable

| Feature | Lovable | Claude Code |
|---------|---------|-------------|
| Editing | Visual interface | Text-based prompts |
| Preview | Instant preview | Need dev server |
| Deployment | Automatic | Manual or CI/CD |
| Version Control | Automatic commits | Manual git usage |
| Collaboration | Built-in | Through git/GitHub |

---

## Best Practices

### When Requesting Changes
1. **Be specific:** "Change the header background to dark blue" is better than "make it darker"
2. **One thing at a time:** Easier to verify and debug
3. **Test after changes:** Ask Claude to build and verify

### Code Quality
- Claude follows React best practices
- TypeScript types are maintained
- Accessibility standards observed
- Security best practices applied

---

## Getting Help

### Documentation Files
- `README.md` - Project overview
- `MEMBERSHIP_GUIDE.md` - Membership system details
- `TESTING_GUIDE.md` - Testing procedures
- `SECURITY.md` - Security considerations

### Ask Claude
Claude can help with:
- Finding specific code
- Explaining how features work
- Making changes
- Debugging issues
- Writing new features
- Optimizing performance

---

## Example Workflows

### Adding a New Page
**You:** "Create a new page at /about-us with a hero section and team bios"

**Claude will:**
1. Create `src/pages/AboutUs.tsx`
2. Add route in main routing file
3. Add navigation link if needed
4. Style using existing theme

### Modifying Existing Feature
**You:** "On the membership page, add a FAQ section below the pricing cards"

**Claude will:**
1. Open `src/pages/Membership.tsx`
2. Add FAQ component/section
3. Maintain existing styling
4. Verify build succeeds

### Debugging an Issue
**You:** "When I click login, nothing happens"

**Claude will:**
1. Check login component code
2. Review authentication flow
3. Check for console errors
4. Identify and fix the issue
5. Test the fix

---

## Summary

Your ForSWAGs platform is now fully independent of Lovable and works entirely through Claude Code. You can:

✅ Edit any file by asking Claude
✅ Build and preview locally
✅ Deploy to your hosting platform
✅ Maintain full control over the codebase
✅ Use git for version control if desired

The workflow is conversational - just tell Claude what you want to accomplish, and it will handle the technical implementation.

Happy coding! 🚀
