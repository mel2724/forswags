# Mobile Experience Documentation

This document outlines the mobile-first features and Progressive Web App (PWA) capabilities implemented in ForSWAGs.

## Overview

ForSWAGs provides a native app-like experience on mobile devices with full PWA support, offline capabilities, touch gestures, and responsive design.

## Progressive Web App (PWA) Features

### Installation

**Desktop/Android:**
1. Visit the app in Chrome/Edge
2. Look for the install prompt (after 30 seconds)
3. Click "Install" to add to your device
4. Or use the browser's install menu (⋮ → Install app)

**iOS:**
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install

**Benefits:**
- Standalone app window (no browser UI)
- Home screen icon
- Faster loading times
- Offline access to cached content
- Native app-like navigation

### Manifest Configuration

The app includes a complete web manifest (`/manifest.json`) with:
- App name and short name
- Brand colors (purple theme)
- App icons (192x192, 512x512)
- Display mode: standalone
- Orientation: portrait-primary
- Shortcuts to key pages (Dashboard, Profile, Evaluations)

### Service Worker

**Caching Strategy:**
- **Static assets**: Cache-first with runtime fallback
- **API requests**: Network-first with cache fallback
- **Images/Media**: Cached on first load

**Offline Support:**
- Core pages work offline
- Cached data accessible without connection
- Offline indicator shows connection status
- Actions queued when offline, synced when online

**Update Handling:**
- Automatic update checks every hour
- Update notification when new version available
- One-click update and reload

## Touch Gestures

### Swipe Actions

Use the `useTouchGestures` hook for swipe detection:

```tsx
import { useTouchGestures } from '@/hooks/useTouchGestures';

const gestures = useTouchGestures({
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onSwipeUp: () => console.log('Swiped up'),
  onSwipeDown: () => console.log('Swiped down'),
  onLongPress: () => console.log('Long pressed'),
  onDoubleTap: () => console.log('Double tapped'),
  threshold: 50, // Minimum swipe distance in pixels
  longPressDelay: 500, // Long press duration in ms
});

return <div {...gestures}>Swipeable content</div>;
```

### Pull to Refresh

Use the `usePullToRefresh` hook:

```tsx
import { usePullToRefresh } from '@/hooks/useTouchGestures';

const pullToRefresh = usePullToRefresh(async () => {
  await refetchData();
}, 80); // Pull threshold in pixels

return <div {...pullToRefresh}>Content</div>;
```

**Supported Gestures:**
- **Swipe Left/Right**: Navigate, dismiss items
- **Swipe Up/Down**: Scroll alternatives
- **Long Press**: Context menus, actions
- **Double Tap**: Quick actions, zoom
- **Pull Down**: Refresh content

## Mobile Navigation

### Bottom Navigation Bar

On mobile devices, a bottom navigation bar provides quick access to:
- **Home** (Dashboard)
- **Profile** (Athlete profile)
- **Evaluations** (Performance reviews)
- **Alerts** (Notifications)

**Features:**
- Fixed at bottom of screen
- Active state highlighting
- Touch-optimized (44px minimum targets)
- Safe area support (notch/home indicator)
- Smooth transitions

**Visibility:**
- Shows only on mobile/tablet devices
- Hidden on desktop (>768px)
- Hidden on public pages (landing, auth)

### Safe Area Support

The app respects device safe areas:
- Top safe area for status bar
- Bottom safe area for home indicator/notch
- Proper padding on notched devices

## Offline Mode

### Offline Indicator

A banner appears when the device goes offline:
- Red alert with WiFi-off icon
- "You're offline" message
- Green confirmation when back online
- Auto-dismisses after 3 seconds

### Cached Content

**Always available offline:**
- Static assets (HTML, CSS, JS)
- App icons and images
- UI components

**Available with prior load:**
- Dashboard data
- Profile information
- Evaluations
- Media gallery

**Not available offline:**
- Real-time data updates
- File uploads
- New content creation
- Authentication changes

### Queue System

When offline, user actions are queued:
1. User performs action (like, comment, etc.)
2. Action saved to local queue
3. Optimistic UI update
4. When online, queue processes automatically
5. Server state syncs

## Performance Optimizations

### Mobile-Specific

- **Touch-friendly targets**: Minimum 44px tap areas
- **Lazy loading**: Images load as needed
- **Code splitting**: Routes load on demand
- **Font optimization**: System fonts prioritized
- **Reduced animations**: On low-power devices

### Loading States

- Skeleton screens for better perceived performance
- Progressive image loading
- Instant feedback on interactions
- Optimistic UI updates

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Layout Adaptations

**Mobile:**
- Single column layouts
- Bottom navigation
- Collapsed sidebar
- Full-width cards
- Stacked forms

**Tablet:**
- Two-column layouts where appropriate
- Optional sidebar
- Larger touch targets
- Grid layouts

**Desktop:**
- Multi-column layouts
- Persistent sidebar
- Hover interactions
- Advanced features visible

## Native Features (Via Capacitor)

ForSWAGs can be enhanced with native capabilities using Capacitor:

### Recommended Plugins

```bash
# Camera access
npm install @capacitor/camera

# Push notifications
npm install @capacitor/push-notifications

# File system
npm install @capacitor/filesystem

# Geolocation
npm install @capacitor/geolocation

# Share API
npm install @capacitor/share

# Haptics (vibration)
npm install @capacitor/haptics
```

### Building for Mobile

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build web assets
npm run build

# Sync to native platforms
npx cap sync

# Open in native IDE
npx cap open ios
npx cap open android
```

## Testing Mobile Experience

### In Browser

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device preset or custom dimensions
4. Test touch events with mouse
5. Throttle network to test offline

### On Device

1. Connect device via USB
2. Enable developer mode
3. Use Chrome remote debugging
4. Access `chrome://inspect` on desktop
5. Inspect mobile device

### PWA Testing

**Desktop:**
- Chrome: chrome://apps
- Edge: edge://apps

**Mobile:**
- Install from browser menu
- Test offline mode (airplane mode)
- Test app updates

## Accessibility on Mobile

### Touch Accessibility

- Minimum 44px touch targets (WCAG 2.5.5)
- Adequate spacing between targets
- Visual feedback on touch
- No hover-dependent features

### Screen Readers

- VoiceOver (iOS) fully supported
- TalkBack (Android) fully supported
- Semantic HTML for proper navigation
- ARIA labels on all controls

### Zoom & Text Size

- Supports pinch-to-zoom
- Text scales with device settings
- Custom text size controls in app
- Layout reflows properly at all sizes

## Best Practices

### Do's ✅

- Use touch gestures for common actions
- Provide visual feedback immediately
- Cache aggressively for offline use
- Test on real devices regularly
- Support both orientations
- Use native patterns where possible

### Don'ts ❌

- Don't rely solely on hover states
- Don't use tiny touch targets (<44px)
- Don't assume constant connectivity
- Don't ignore safe areas
- Don't disable zoom
- Don't use complex gestures only

## Troubleshooting

### PWA Not Installing

**Issue**: Install prompt doesn't appear

**Solutions:**
1. Ensure HTTPS connection (or localhost)
2. Check manifest.json is accessible
3. Verify service worker registered
4. Clear browser cache
5. Wait 30 seconds for auto-prompt

### Service Worker Issues

**Issue**: Updates not appearing

**Solutions:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear application cache (DevTools → Application)
3. Unregister service worker manually
4. Check console for errors

### Touch Gestures Not Working

**Issue**: Swipes not detected

**Solutions:**
1. Check threshold value (lower = more sensitive)
2. Verify no conflicting scroll handlers
3. Test on actual touch device
4. Check event handlers attached

### Offline Mode Issues

**Issue**: Content not available offline

**Solutions:**
1. Load content at least once while online
2. Check service worker cache
3. Verify network tab shows cached responses
4. Clear cache and reload

## Performance Metrics

### Target Metrics

- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.8s
- **Speed Index**: < 3.4s
- **Total Blocking Time**: < 200ms
- **Cumulative Layout Shift**: < 0.1

### Lighthouse Score Goals

- **Performance**: > 90
- **Accessibility**: 100
- **Best Practices**: > 95
- **SEO**: 100
- **PWA**: 100

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Touch Guidelines](https://developers.google.com/web/fundamentals/accessibility/accessible-styles)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Mobile Web Best Practices](https://www.w3.org/TR/mobile-bp/)

## Future Enhancements

Planned mobile improvements:
- Biometric authentication (Face ID, Touch ID)
- Camera integration for media upload
- Push notifications
- Background sync for offline actions
- Native sharing integration
- Haptic feedback
- AR features for athlete visualization

---

**Questions?** Check our [main documentation](./README.md) or reach out to the development team.
