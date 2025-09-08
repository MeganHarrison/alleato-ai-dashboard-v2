# Hydration Error Prevention Guide

## Overview

Hydration errors occur when the HTML generated on the server doesn't match what React expects on the client. This is a common issue in Next.js applications, especially when dealing with theme-dependent rendering.

## Common Causes

1. **Theme Mismatch**: Server renders with default theme, client renders with user's saved theme
2. **Dynamic Content**: Using `Date.now()`, `Math.random()`, or other non-deterministic values
3. **Browser-Only APIs**: Accessing `window`, `localStorage`, or other client-only APIs during SSR
4. **Browser Extensions**: Extensions that modify the DOM before React hydrates

## Key Solutions Implemented

### 1. HTML Element Suppression

In `/app/layout.tsx`:
```tsx
<html lang="en" suppressHydrationWarning>
```

This prevents React from warning about theme attributes added by next-themes.

### 2. Theme Provider Configuration

In `/components/theme-provider.tsx`:
```tsx
<NextThemesProvider 
  attribute="data-theme" 
  defaultTheme="light" 
  enableSystem 
  disableTransitionOnChange
  suppressHydrationWarning
  {...props}
>
```

### 3. Safe Theme-Dependent Rendering Pattern

**❌ WRONG - Causes Hydration Errors:**
```tsx
const { theme } = useTheme()
return <Image src={theme === 'dark' ? '/dark-logo.png' : '/light-logo.png'} />
```

**✅ CORRECT - Prevents Hydration Errors:**
```tsx
const { theme, resolvedTheme } = useTheme()
const [mounted, setMounted] = React.useState(false)

React.useEffect(() => {
  setMounted(true)
}, [])

const logoSrc = mounted 
  ? (resolvedTheme === 'dark' ? '/dark-logo.png' : '/light-logo.png')
  : '/light-logo.png' // Default for SSR

return <Image src={logoSrc} alt="Logo" />
```

## Implementation Checklist

When using theme-dependent rendering:

1. **Always use the mounted pattern** for components that change based on theme
2. **Provide a default value** for server-side rendering
3. **Use `resolvedTheme`** instead of `theme` for accurate theme detection
4. **Add `priority`** to theme-dependent images to prevent layout shift
5. **Use CSS classes** (`dark:` modifiers) when possible instead of JS-based switching

## Components Following Best Practices

✅ `/components/app-sidebar.tsx` - Properly handles theme-dependent logo
✅ Theme-dependent CSS classes throughout the app

## Anti-Patterns to Avoid

1. **Direct theme access without mounting check**
2. **Using `window` or `document` in component body**
3. **Rendering different content based on `typeof window !== 'undefined'`**
4. **Using non-deterministic values in initial render**

## Testing for Hydration Issues

1. Check browser console for hydration warnings
2. View page source to see server-rendered HTML
3. Compare with React DevTools component tree
4. Test with JavaScript disabled to see SSR output

## Quick Reference

```tsx
// Safe theme hook usage template
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeAwareComponent() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return SSR-safe default
    return <div>Default content</div>
  }

  // Safe to use theme after mounting
  return <div>{resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
}
```

## Remember

- Hydration errors won't be "patched up" by React - they need to be fixed
- The server and client must produce identical HTML on first render
- Use mounting patterns for any client-specific rendering
- Prefer CSS-based theming over JavaScript when possible