---
title: FRONT-004 Phase 6 - Styling Guide
description: Comprehensive guide for component styling and CSS patterns
date: January 17, 2026
---

# FRONT-004 PHASE 6: STYLING GUIDE & DEVELOPER REFERENCE

## Table of Contents
1. [Quick Start](#quick-start)
2. [CSS Architecture](#css-architecture)
3. [Component Styling Patterns](#component-styling-patterns)
4. [Responsive Design](#responsive-design)
5. [Theming & CSS Variables](#theming--css-variables)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)
10. [Component Checklist](#component-checklist)

---

## Quick Start

### Using Design Tokens

**CSS Approach** (recommended for static styles):
```css
.card {
  background-color: var(--surface-default);
  border: 1px solid var(--border-default);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  color: var(--text-primary);
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
}
```

**React Approach** (for dynamic styles):
```typescript
import { useCSSVariable, useColorVariants } from '@/lib/theme/variables-hooks';

export function Card() {
  const bgColor = useCSSVariable('--surface-default');
  const [textColor] = useColorVariants('--text-primary');
  
  return (
    <div style={{
      backgroundColor: bgColor,
      color: textColor,
    }}>
      Content
    </div>
  );
}
```

### Using Spacing Tokens

```css
/* Padding */
.section {
  padding: var(--spacing-lg);       /* 1.5rem */
  padding-top: var(--spacing-xl);   /* 2rem */
}

/* Margin */
.button {
  margin-bottom: var(--spacing-md); /* 1rem */
}

/* Gap in flexbox/grid */
.container {
  display: flex;
  gap: var(--spacing-md);
}
```

### Using Responsive Design

```css
/* Mobile-first approach */
.card {
  padding: var(--spacing-md);       /* Mobile: 1rem */
  font-size: var(--font-size-base);
  columns: 1;
}

/* Tablet and up */
@media (min-width: 640px) {
  .card {
    padding: var(--spacing-lg);     /* Tablet: 1.5rem */
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-xl);     /* Desktop: 2rem */
  }
}
```

---

## CSS Architecture

### File Organization

```
app/frontend/src/
├── styles/
│   ├── responsive-base.css          # Base responsive utilities
│   ├── theme-variables.css          # CSS custom properties
│   ├── theme-variables-with-prefixes.css  # Vendor prefixes
│   ├── index.css                    # Main entry point
│   └── [component-name].module.css  # Component-specific (CSS Modules)
│
├── lib/theme/
│   ├── breakpoints.ts               # Breakpoint system
│   ├── variables-api.ts             # Programmatic CSS variable API
│   ├── variables-hooks.ts           # React hooks for CSS variables
│   └── types.ts                     # TypeScript types
│
└── components/
    ├── [category]/
    │   ├── Component.tsx            # Component file
    │   └── Component.module.css      # Component-specific styles
    └── ...
```

### CSS Cascade & Specificity

**Hierarchy** (lowest to highest specificity):
1. **styles/responsive-base.css** - Global utilities, resets
2. **styles/theme-variables.css** - Design tokens (custom properties)
3. **Component.module.css** - Component-specific styles
4. **Inline styles** - Only for truly dynamic values
5. **!important** - Never use (exceptions documented)

**Rule of Thumb**: Use the lowest specificity needed.

---

## Component Styling Patterns

### Pattern 1: Utility-First with CSS Modules

**When to use**: Complex components with many states

```css
/* Button.module.css */
.button {
  /* Base styles */
  padding: var(--button-padding);
  border: 1px solid var(--border-default);
  border-radius: var(--button-border-radius);
  background-color: var(--accent-primary);
  color: var(--text-inverse);
  font-weight: var(--font-weight-medium);
  
  /* Transitions */
  transition: background-color var(--transition-fast);
  cursor: pointer;
}

.button:hover {
  background-color: var(--accent-secondary);
}

.button:active {
  transform: scale(0.98);
}

.button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary {
  background-color: var(--accent-primary);
}

.button.secondary {
  background-color: var(--surface-default);
  color: var(--text-primary);
  border-color: var(--border-default);
}

.button.success {
  background-color: var(--accent-success);
}

.button.error {
  background-color: var(--accent-error);
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  disabled, 
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Pattern 2: Responsive Grid Layout

```css
/* Grid.module.css */
.grid {
  display: grid;
  grid-template-columns: 1fr;  /* Mobile: 1 column */
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

/* Tablet: 2 columns */
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
  }
}

/* Desktop: 3-4 columns */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-xl);
    padding: var(--spacing-3xl);
  }
}
```

### Pattern 3: Card Component

```css
/* Card.module.css */
.card {
  background-color: var(--surface-default);
  border: 1px solid var(--border-default);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  
  transition: all var(--transition-normal);
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
  border-color: var(--border-strong);
}

.card.interactive {
  cursor: pointer;
  transform: translateY(0);
}

.card.interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.card.selectable.selected {
  background-color: var(--selection-bg);
  border-color: var(--selection-text);
}
```

### Pattern 4: Form Components

```css
/* Form.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.label {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input {
  padding: var(--input-padding);
  border: 1px solid var(--border-default);
  border-radius: var(--input-border-radius);
  background-color: var(--surface-default);
  color: var(--text-primary);
  font-size: 16px;  /* Prevents iOS auto-zoom */
  
  transition: border-color var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 3px var(--selection-bg);
}

.input:disabled {
  background-color: var(--surface-active);
  color: var(--text-muted);
  cursor: not-allowed;
}

.input.error {
  border-color: var(--accent-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.error {
  color: var(--accent-error);
  font-size: var(--font-size-xs);
}
```

### Pattern 5: Modal/Overlay

```css
/* Modal.module.css */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  
  animation: fadeIn var(--transition-normal);
}

.modal {
  background-color: var(--bg-primary);
  border-radius: var(--card-border-radius);
  padding: var(--modal-padding);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  z-index: var(--z-modal);
  
  animation: slideInUp var(--transition-normal);
}

/* Mobile: Full width modal */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: var(--card-border-radius) var(--card-border-radius) 0 0;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .modalOverlay {
    align-items: flex-end;
  }
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-default);
  padding-bottom: var(--spacing-lg);
}

.modalTitle {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.closeButton {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color var(--transition-fast);
}

.closeButton:hover {
  background-color: var(--surface-hover);
}
```

---

## Responsive Design

### Breakpoint System

```typescript
// From lib/theme/breakpoints.ts
export const BREAKPOINTS = {
  MOBILE_MIN: 0,           // Default/mobile
  TABLET_MIN: 640,         // Tablets
  TABLET_LARGE_MIN: 768,   // Large tablets
  DESKTOP_MIN: 1024,       // Desktops
  DESKTOP_LARGE_MIN: 1280, // Large desktops
  DESKTOP_XLARGE_MIN: 1536, // Extra large
};
```

### Responsive CSS Patterns

**Pattern A: Mobile-First (Recommended)**
```css
.section {
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
}

@media (min-width: 640px) {
  .section {
    padding: var(--spacing-lg);
  }
}

@media (min-width: 1024px) {
  .section {
    padding: var(--spacing-xl);
  }
}
```

**Pattern B: Responsive Values via CSS Variables**
```css
.container {
  --container-padding: var(--spacing-md);
  --container-width: 100%;
  
  padding: var(--container-padding);
  max-width: var(--container-width);
}

@media (min-width: 640px) {
  .container {
    --container-padding: var(--spacing-lg);
    --container-width: 90%;
  }
}

@media (min-width: 1024px) {
  .container {
    --container-padding: var(--spacing-xl);
    --container-width: 80%;
  }
}
```

### Responsive React Component Pattern

```typescript
import { useBreakpoint, useResponsiveValue } from '@/lib/theme/breakpoints';

export function ResponsiveLayout() {
  const breakpoint = useBreakpoint();
  const columns = useResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 3,
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }}>
      {/* Content */}
    </div>
  );
}
```

---

## Theming & CSS Variables

### Reading CSS Variables in React

```typescript
import { 
  useCSSVariable, 
  useColorVariants,
  useAllCSSVariables 
} from '@/lib/theme/variables-hooks';

export function ThemedComponent() {
  // Get single variable
  const primaryColor = useCSSVariable('--accent-primary');
  
  // Get color variants (base, light, dark)
  const [baseColor, lightColor, darkColor] = useColorVariants('--accent-primary');
  
  // Get all variables
  const allVars = useAllCSSVariables();
  
  return (
    <div style={{
      backgroundColor: primaryColor,
      borderColor: baseColor,
    }}>
      Themed content
    </div>
  );
}
```

### Programmatic CSS Variable Manipulation

```typescript
import { 
  getCSSVariable, 
  setCSSVariable,
  applyThemeVariables 
} from '@/lib/theme/variables-api';

// Read value
const currentColor = getCSSVariable('--accent-primary');

// Set single variable
setCSSVariable('--accent-primary', '#1976d2');

// Apply complete theme
applyThemeVariables({
  '--accent-primary': '#1976d2',
  '--bg-primary': '#ffffff',
  // ... other variables
});

// Watch for changes
watchThemeVariables((changes) => {
  console.log('Theme changed:', changes);
});
```

---

## Common Patterns

### 1. Hover State with Transition

```css
.button {
  background-color: var(--accent-primary);
  transition: background-color var(--transition-fast);
}

.button:hover {
  background-color: var(--accent-secondary);
}
```

### 2. Focus Ring (Accessibility)

```css
.focusable {
  outline: none;
  transition: box-shadow var(--transition-fast);
}

.focusable:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

### 3. Disabled State

```css
.interactive:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 4. Loading State with Animation

```css
.loadingSpinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 5. Truncated Text

```css
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.truncateMultiline {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### 6. Selection State

```css
.selectable {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.selectable.selected {
  background-color: var(--selection-bg);
  color: var(--selection-text);
}
```

### 7. Dark Mode Support

```css
/* Light mode (default) */
.component {
  background-color: #ffffff;
  color: #1a1a1a;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .component {
    background-color: #121212;
    color: #e5e5e5;
  }
}

/* Or use CSS variables (recommended) */
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

---

## Troubleshooting

### Problem: Colors not updating when theme changes

**Cause**: Using hardcoded colors instead of CSS variables

**Solution**:
```css
/* ❌ WRONG */
.button { background-color: #1976d2; }

/* ✅ CORRECT */
.button { background-color: var(--accent-primary); }
```

### Problem: Mobile styles not applying

**Cause**: Wrong media query syntax or cascading issue

**Solution**:
```css
/* ✅ CORRECT - Mobile first */
.item { width: 100%; }
@media (min-width: 640px) { .item { width: 50%; } }

/* ❌ WRONG - Desktop first (harder to override on mobile) */
@media (max-width: 640px) { .item { width: 100%; } }
.item { width: 50%; }
```

### Problem: Touch targets too small on mobile

**Cause**: Not respecting 44px minimum

**Solution**:
```css
/* ✅ CORRECT */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Problem: Animation causing layout shift

**Cause**: Using `margin` or `width` in animation

**Solution**:
```css
/* ❌ WRONG - Causes layout shift */
@keyframes slideIn {
  from { margin-left: -100px; }
  to { margin-left: 0; }
}

/* ✅ CORRECT - Use transform (GPU accelerated) */
@keyframes slideIn {
  from { transform: translateX(-100px); }
  to { transform: translateX(0); }
}
```

### Problem: Styles not applying in dark mode

**Cause**: CSS variables not defined for dark theme

**Solution**:
```css
/* Define defaults */
:root {
  --bg-primary: #ffffff;
}

/* Override for dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #121212;
  }
}
```

---

## Best Practices

### ✅ DO

- [ ] Use CSS variables for colors and spacing
- [ ] Mobile-first responsive design
- [ ] CSS Modules for component styles
- [ ] Semantic HTML elements
- [ ] Focus indicators for accessibility
- [ ] 44px minimum touch targets
- [ ] Transitions for state changes
- [ ] `transform` instead of position/size for animations
- [ ] Dark mode support via CSS variables
- [ ] Vendor prefixes where needed

### ❌ DON'T

- [ ] Hardcode colors in CSS
- [ ] Use `!important` (except accessibility fixes)
- [ ] Skip focus states
- [ ] Use fixed sizes for touch buttons
- [ ] Animate expensive properties (width, height, position)
- [ ] Make touch targets smaller than 44px
- [ ] Remove focus outlines without replacement
- [ ] Use global CSS that affects all components
- [ ] Ignore dark mode preferences
- [ ] Skip vendor prefixes for animations

---

## Migration Guide

### From Hardcoded Colors to CSS Variables

**Before**:
```css
.card {
  background-color: #ffffff;
  border: 1px solid #d0d0d0;
  color: #1a1a1a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**After**:
```css
.card {
  background-color: var(--surface-default);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
}
```

### From Hardcoded Spacing to Spacing Tokens

**Before**:
```css
.section {
  padding: 16px;
  margin-bottom: 24px;
  gap: 12px;
}
```

**After**:
```css
.section {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-sm);
}
```

### From Custom Breakpoints to Standardized

**Before**:
```css
@media (min-width: 500px) { /* Custom */ }
@media (min-width: 900px) { /* Custom */ }
@media (max-width: 480px) { /* Mobile first broken */ }
```

**After**:
```css
@media (min-width: 640px) { /* TABLET_MIN */ }
@media (min-width: 1024px) { /* DESKTOP_MIN */ }
```

---

## Component Styling Checklist

Before marking a component as complete, verify:

### HTML & Structure
- [ ] Semantic HTML elements used
- [ ] Proper heading hierarchy
- [ ] ARIA labels where needed
- [ ] No inline styles (except dynamic values)

### Responsive Design
- [ ] Mobile layout tested (320px)
- [ ] Tablet layout verified (768px)
- [ ] Desktop layout confirmed (1024px+)
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets: 44px minimum

### Styling
- [ ] Uses design tokens (colors, spacing)
- [ ] CSS Modules for scoping
- [ ] No hardcoded colors
- [ ] Transitions defined for state changes
- [ ] Dark mode supported

### Accessibility
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA
- [ ] Keyboard navigation works
- [ ] Respects prefers-reduced-motion
- [ ] Touch-friendly (44px targets)

### States
- [ ] Hover state styled
- [ ] Active state styled
- [ ] Disabled state handled
- [ ] Loading state animated
- [ ] Error state visible

### Dark Mode
- [ ] Colors correct in dark theme
- [ ] Contrast maintained
- [ ] Images visible in dark mode
- [ ] Tested with `prefers-color-scheme: dark`

### Performance
- [ ] No layout thrashing
- [ ] Animations GPU-accelerated (transform)
- [ ] No unnecessary transitions
- [ ] CSS file size reasonable

---

## Conclusion

This styling guide provides patterns and best practices for creating responsive, accessible, and themeable components using Passion OS design system.

**Key Principles**:
1. Use design tokens (not hardcoded values)
2. Mobile-first responsive approach
3. Accessibility from the start (focus, contrast, touch targets)
4. Dark mode support via CSS variables
5. Clean, maintainable CSS patterns

For questions or improvements, refer to:
- [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) - Complete token reference
- [RESPONSIVE_DESIGN_GUIDE.md](./RESPONSIVE_DESIGN_GUIDE.md) - Responsive patterns
- [FRONT_004_PHASE4_AUDIT_REPORT.md](./FRONT_004_PHASE4_AUDIT_REPORT.md) - Responsive audit

---

**Status**: ✅ PHASE 6 COMPLETE  
**Ready for**: Team adoption and component development
