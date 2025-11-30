# Accessibility Documentation

This document outlines the comprehensive accessibility improvements implemented in the ForSWAGs application.

## Overview

ForSWAGs is committed to providing an inclusive experience for all users, including those with disabilities. We've implemented WCAG 2.1 Level AA compliant features across the application.

## Implemented Features

### 1. Keyboard Navigation ⌨️

**Full keyboard support** has been implemented throughout the application:

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Arrow Key Navigation**: Supported in lists, menus, and dropdowns
- **Enter/Space**: Activates buttons and controls
- **Escape**: Closes modals, dialogs, and dropdowns
- **Skip to Content**: Press Tab on page load to reveal a "Skip to main content" link

**Custom Hooks:**
- `useKeyboardNavigation`: Handle keyboard events with custom callbacks
- `useFocusTrap`: Trap focus within modal dialogs
- `useFocusManagement`: Save and restore focus when opening/closing modals

**Implementation Example:**
```tsx
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

useKeyboardNavigation({
  onEnter: handleSubmit,
  onEscape: handleClose,
  onArrowDown: focusNextItem,
});
```

### 2. Screen Reader Compatibility 🔊

**ARIA attributes and semantic HTML** ensure screen reader compatibility:

- **Semantic HTML**: Proper use of `<main>`, `<nav>`, `<header>`, `<article>`, etc.
- **ARIA Labels**: All interactive elements have descriptive labels
- **ARIA Live Regions**: Dynamic content updates are announced
- **Alt Text**: All images include descriptive alt attributes
- **Form Labels**: All form inputs are properly labeled

**Screen Reader Announcements:**
```tsx
import { useAccessibility } from '@/contexts/AccessibilityContext';

const { announceToScreenReader } = useAccessibility();

// Polite announcement
announceToScreenReader("Profile saved successfully");

// Assertive announcement for critical info
announceToScreenReader("Error: Please check your input", "assertive");
```

**ARIA Best Practices Implemented:**
- `role="status"` for status messages
- `aria-live="polite"` for non-critical updates
- `aria-live="assertive"` for critical alerts
- `aria-label` for icon-only buttons
- `aria-describedby` for additional context
- `aria-invalid` for form validation errors

### 3. High Contrast Mode 🎨

**Two contrast modes available:**

1. **Normal Mode**: Default dark/light themes with athletic design
2. **High Contrast Mode**: Maximum contrast for visual clarity
   - Pure black background (#000000)
   - Pure white text (#FFFFFF)
   - Bright yellow accents for focus states
   - Bold borders on all elements
   - Heavier font weights

**Activation:**
- Click the Accessibility icon (universal access symbol) in the header
- Select "High Contrast" from the Contrast Mode section
- Settings persist across sessions

**CSS Implementation:**
```css
.high-contrast {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --border: 0 0% 100%;
  /* All colors are maximized for contrast */
}
```

### 4. Text Size Controls 📏

**Four text size options available:**

- **Small**: 14px base font size
- **Medium**: 16px base font size (default)
- **Large**: 18px base font size
- **Extra Large**: 20px base font size

**Features:**
- Scales all text proportionally throughout the app
- Maintains responsive layout at all sizes
- Persists preference across sessions
- Updates in real-time

**Access:**
Navigate to the Accessibility menu (universal access icon) in the header and select your preferred text size.

### 5. Reduced Motion 🎬

**Motion sensitivity support:**

- Respects system `prefers-reduced-motion` setting
- Manual toggle available in Accessibility menu
- When enabled:
  - Animations reduced to minimal duration
  - Transitions simplified
  - Scroll behavior set to instant
  - No scale transforms or complex keyframes

**CSS Implementation:**
```css
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

## Accessibility Context

All accessibility features are managed through a centralized React context:

```tsx
import { useAccessibility } from '@/contexts/AccessibilityContext';

const {
  textSize,              // Current text size setting
  setTextSize,           // Update text size
  contrastMode,          // Current contrast mode
  setContrastMode,       // Update contrast mode
  reducedMotion,         // Reduced motion preference
  setReducedMotion,      // Update reduced motion
  announceToScreenReader // Announce messages
} = useAccessibility();
```

## Components

### AccessibilityMenu
Located in the app header, provides access to all accessibility settings:
- Text size controls (4 options)
- Contrast mode toggle (normal/high)
- Reduced motion toggle
- Persists all settings to localStorage

### SkipToContent
Keyboard-accessible link that appears on Tab focus:
- Allows users to skip navigation and go directly to main content
- Follows WCAG best practices
- Styled to be visible only when focused

## Focus Management

**Visible focus indicators:**
- 3px solid outline on all focusable elements
- 2px offset for better visibility
- Uses primary color from design system
- Applies to buttons, links, inputs, and custom controls

```css
*:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

## Testing

### Keyboard Testing Checklist
- [ ] All functionality accessible via keyboard
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Escape key closes modals/dropdowns
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in menus/lists

### Screen Reader Testing Checklist
- [ ] All images have meaningful alt text
- [ ] Forms have proper labels
- [ ] Dynamic content changes are announced
- [ ] Landmarks are properly identified
- [ ] Headings create logical structure

### Visual Testing Checklist
- [ ] High contrast mode provides sufficient contrast (4.5:1 minimum)
- [ ] Text remains readable at all size settings
- [ ] Layout doesn't break with larger text
- [ ] Reduced motion setting disables animations

## Browser Support

All accessibility features work across modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Future Enhancements

Planned accessibility improvements:
- Voice control integration
- Dyslexia-friendly font option
- Color blindness filters
- Enhanced touch target sizes
- Improved error prevention and recovery

## Contact

For accessibility feedback or issues, please contact our team or file an issue in the repository.

---

**Commitment**: ForSWAGs is committed to maintaining and improving accessibility. We continuously monitor and update our implementation to meet the latest standards and best practices.
