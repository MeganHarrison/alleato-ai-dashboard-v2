# Mobile Optimization Guide

## Table of Contents
- [Overview](#overview)
- [Responsive Design Architecture](#responsive-design-architecture)
- [Mobile-First Components](#mobile-first-components)
- [Touch Interface Optimization](#touch-interface-optimization)
- [Performance Optimization](#performance-optimization)
- [PWA Features](#pwa-features)
- [Testing & Validation](#testing--validation)
- [Mobile-Specific Features](#mobile-specific-features)

## Overview

The Alleato AI Dashboard is built with a mobile-first approach using Tailwind CSS and responsive design principles. This guide documents the mobile optimization features, responsive breakpoints, and mobile-specific functionality.

**Key Mobile Features:**
- **Responsive Layout** - Adapts from mobile (320px) to desktop (1920px+)
- **Touch-Optimized UI** - Large touch targets and swipe gestures
- **Mobile Navigation** - Collapsible sidebar and bottom navigation
- **Optimized Performance** - Lazy loading and reduced bundle size
- **PWA Ready** - Progressive Web App capabilities
- **Offline Support** - Critical functionality works offline

## Responsive Design Architecture

### Breakpoint System
```typescript
// Tailwind CSS Breakpoints (tailwind.config.ts)
const breakpoints = {
  'sm': '640px',   // Small tablets and large phones
  'md': '768px',   // Tablets
  'lg': '1024px',  // Small laptops
  'xl': '1280px',  // Large laptops and desktops
  '2xl': '1536px'  // Large desktops
};

// Custom breakpoints for specific needs
const customBreakpoints = {
  'xs': '475px',   // Large mobile phones
  '3xl': '1920px', // Ultra-wide displays
};
```

### Layout Structure
```typescript
// app/layout.tsx - Responsive root layout
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white">
        {/* Mobile-first responsive container */}
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Mobile: Stacked layout, Desktop: Side-by-side */}
          <MobileSidebar className="lg:hidden" />
          <DesktopSidebar className="hidden lg:block" />
          
          {/* Main content area with responsive padding */}
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
        
        {/* Global AI Chat - Mobile optimized */}
        <AIChat />
      </body>
    </html>
  );
}
```

### Grid System
```typescript
// Responsive grid patterns used throughout
const responsiveGrids = {
  // Dashboard cards
  'dashboard': 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4',
  
  // Data tables
  'table': 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
  
  // Project cards
  'projects': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6',
  
  // Form layouts
  'form': 'grid grid-cols-1 md:grid-cols-2 gap-4',
};
```

## Mobile-First Components

### Navigation Components

#### Mobile Sidebar (`components/mobile-sidebar.tsx`)
```typescript
interface MobileSidebarProps {
  className?: string;
}

export function MobileSidebar({ className }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={cn("lg:hidden", className)}>
      {/* Mobile header with hamburger menu */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <Logo className="h-8 w-auto" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Slide-out navigation menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg lg:hidden"
          >
            <NavigationMenu onItemClick={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

#### Bottom Navigation (`components/bottom-navigation.tsx`)
```typescript
export function BottomNavigation() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/meetings', icon: Calendar, label: 'Meetings' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg sm:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center py-2 px-3 text-xs transition-colors",
              pathname === href
                ? "text-[#DB802D]"
                : "text-gray-600 hover:text-[#DB802D]"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

### Card Components

#### Responsive Project Card
```typescript
interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }} // Mobile tap feedback
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all",
        "hover:shadow-md focus-within:ring-2 focus-within:ring-[#DB802D] focus-within:ring-offset-2",
        // Mobile optimizations
        "touch-manipulation", // Optimizes touch interactions
        "min-h-[200px] sm:min-h-[220px]" // Minimum touch target size
      )}
    >
      {/* Mobile-optimized header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
              {project.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-3 sm:line-clamp-2">
              {project.description}
            </p>
          </div>
          
          {/* Mobile-friendly dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-8 w-8 p-0 focus:ring-2 focus:ring-[#DB802D]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-sm py-3">
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-3">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto min-h-[44px]" // 44px minimum for touch
          >
            View Details
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto min-h-[44px] bg-[#DB802D] hover:bg-[#C07025]"
          >
            Open Project
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

### Form Components

#### Mobile-Optimized Forms
```typescript
interface MobileFormProps {
  onSubmit: (data: FormData) => void;
}

export function MobileOptimizedForm({ onSubmit }: MobileFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form field with mobile optimizations */}
      <div className="space-y-4">
        <FormField
          control={control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Project Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    "w-full transition-colors",
                    // Mobile optimizations
                    "min-h-[44px]", // Minimum touch target
                    "text-base", // Prevents zoom on iOS
                    "rounded-lg", // Better touch feedback
                    "focus:ring-2 focus:ring-[#DB802D] focus:border-[#DB802D]"
                  )}
                  placeholder="Enter project name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Textarea with mobile optimizations */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className={cn(
                    "w-full min-h-[120px] resize-none transition-colors",
                    "text-base", // Prevents zoom on iOS
                    "focus:ring-2 focus:ring-[#DB802D] focus:border-[#DB802D]"
                  )}
                  placeholder="Describe your project..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Mobile-optimized button group */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto min-h-[44px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto min-h-[44px] bg-[#DB802D] hover:bg-[#C07025]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Project'
          )}
        </Button>
      </div>
    </form>
  );
}
```

## Touch Interface Optimization

### Touch Target Guidelines
```typescript
// Touch target size constants
export const TOUCH_TARGETS = {
  MINIMUM: '44px',      // iOS HIG minimum
  COMFORTABLE: '48px',  // Android recommended
  LARGE: '56px',        // For primary actions
} as const;

// Touch-optimized component classes
export const touchOptimizedClasses = {
  button: cn(
    `min-h-[${TOUCH_TARGETS.MINIMUM}] min-w-[${TOUCH_TARGETS.MINIMUM}]`,
    "touch-manipulation", // Optimizes touch response
    "select-none", // Prevents text selection on touch
    "active:scale-[0.98] transition-transform duration-75" // Touch feedback
  ),
  
  card: cn(
    "touch-manipulation",
    "active:scale-[0.99] transition-transform duration-100"
  ),
  
  input: cn(
    `min-h-[${TOUCH_TARGETS.MINIMUM}]`,
    "text-base", // Prevents zoom on iOS
    "touch-manipulation"
  ),
};
```

### Gesture Support
```typescript
// Swipe gesture hook for mobile interactions
export function useSwipeGesture(
  ref: RefObject<HTMLElement>,
  callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  }
) {
  useEffect(() => {
    if (!ref.current) return;
    
    let startX = 0;
    let startY = 0;
    let isScrolling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        isScrolling = false;
        if (Math.abs(diffX) > 50) {
          if (diffX > 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft();
          } else if (diffX < 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight();
          }
        }
      }
    };
    
    const element = ref.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [ref, callbacks]);
}
```

### Mobile Navigation Patterns
```typescript
// Tab-based mobile navigation
export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="sm:hidden">
      {/* Horizontal scrolling tabs */}
      <div className="flex space-x-1 overflow-x-auto py-2 px-4 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "min-w-[80px] text-center", // Minimum touch target width
              activeTab === tab.id
                ? "bg-[#DB802D] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content with swipe support */}
      <SwipeableViews
        index={tabs.findIndex(tab => tab.id === activeTab)}
        onChangeIndex={(index) => onTabChange(tabs[index].id)}
        className="mt-4"
      >
        {tabs.map((tab) => (
          <div key={tab.id} className="px-4">
            {tab.content}
          </div>
        ))}
      </SwipeableViews>
    </div>
  );
}
```

## Performance Optimization

### Image Optimization
```typescript
// Mobile-optimized image component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

export function ResponsiveImage({ src, alt, sizes, className }: ResponsiveImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      className={cn("object-cover", className)}
      // Mobile performance optimizations
      priority={false} // Lazy load by default
      quality={75} // Reduced quality for mobile
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
}
```

### Lazy Loading Implementation
```typescript
// Lazy loading hook for mobile performance
export function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Load 50px before element is visible
        threshold: 0.1,
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return { ref, isVisible };
}

// Usage in component
export function LazyProjectCard({ project }) {
  const { ref, isVisible } = useLazyLoad();
  
  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible ? (
        <ProjectCard project={project} />
      ) : (
        <ProjectCardSkeleton />
      )}
    </div>
  );
}
```

### Bundle Optimization
```typescript
// Dynamic imports for mobile performance
const MeetingIntelligence = dynamic(
  () => import('@/components/meeting-intelligence'),
  { 
    loading: () => <MeetingIntelligenceSkeleton />,
    ssr: false // Client-side only for mobile
  }
);

const AIChat = dynamic(
  () => import('@/components/ai-chat'),
  {
    loading: () => <div className="hidden" />,
    ssr: false
  }
);

const Charts = dynamic(
  () => import('@/components/charts'),
  {
    loading: () => <ChartsSkeleton />,
    ssr: false
  }
);
```

## PWA Features

### Progressive Web App Configuration
```typescript
// next.config.mjs - PWA configuration
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    }
  ],
  // ... other Next.js config
});
```

### Web App Manifest
```json
// public/manifest.json
{
  "name": "Alleato AI Dashboard",
  "short_name": "Alleato AI",
  "description": "Enterprise AI-powered business intelligence platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#DB802D",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "AI Chat",
      "short_name": "Chat",
      "description": "Start a new AI conversation",
      "url": "/chat",
      "icons": [{ "src": "/icons/chat-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Projects",
      "short_name": "Projects",
      "description": "View and manage projects",
      "url": "/projects",
      "icons": [{ "src": "/icons/projects-icon.png", "sizes": "96x96" }]
    }
  ]
}
```

### Offline Support
```typescript
// lib/offline-support.ts
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private callbacks: Array<(online: boolean) => void> = [];
  
  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }
  
  private handleOnline() {
    this.isOnline = true;
    this.notifyCallbacks();
    this.syncOfflineData();
  }
  
  private handleOffline() {
    this.isOnline = false;
    this.notifyCallbacks();
  }
  
  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.isOnline));
  }
  
  private async syncOfflineData() {
    // Sync offline data when connection is restored
    const offlineActions = this.getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await this.executeAction(action);
        this.removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }
  }
  
  public getOfflineActions(): OfflineAction[] {
    const stored = localStorage.getItem('offline-actions');
    return stored ? JSON.parse(stored) : [];
  }
  
  public addOfflineAction(action: OfflineAction) {
    const actions = this.getOfflineActions();
    actions.push({ ...action, id: Date.now().toString() });
    localStorage.setItem('offline-actions', JSON.stringify(actions));
  }
}

// Usage in components
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const offlineManager = OfflineManager.getInstance();
    
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online);
    };
    
    offlineManager.onStatusChange(handleStatusChange);
    
    return () => {
      offlineManager.removeStatusChangeListener(handleStatusChange);
    };
  }, []);
  
  return isOnline;
}
```

## Testing & Validation

### Mobile Testing Strategy
```bash
# Mobile testing commands
npm run test:mobile    # Mobile-specific tests
npm run test:responsive # Responsive design tests
npm run lighthouse:mobile # Mobile performance audit
```

### Browser Testing Matrix
| Device Type | Screen Size | Browser | Test Status |
|-------------|-------------|---------|-------------|
| **iPhone SE** | 375×667 | Safari | ✅ Tested |
| **iPhone 12** | 390×844 | Safari | ✅ Tested |
| **iPhone 14 Pro** | 393×852 | Safari | ✅ Tested |
| **Android Small** | 360×640 | Chrome | ✅ Tested |
| **Android Medium** | 412×892 | Chrome | ✅ Tested |
| **iPad** | 768×1024 | Safari | ✅ Tested |
| **iPad Pro** | 1024×1366 | Safari | ✅ Tested |

### Performance Metrics
```typescript
// Mobile performance targets
export const PERFORMANCE_TARGETS = {
  FIRST_CONTENTFUL_PAINT: 2000, // 2 seconds
  LARGEST_CONTENTFUL_PAINT: 3000, // 3 seconds
  FIRST_INPUT_DELAY: 100, // 100ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // 0.1 or less
  TIME_TO_INTERACTIVE: 4000, // 4 seconds
} as const;

// Performance monitoring
export function measurePerformance() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  }
}
```

### Automated Testing
```typescript
// playwright.config.ts - Mobile testing configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
});
```

## Mobile-Specific Features

### AI Chat Mobile Optimizations
```typescript
// components/ai-chat-mobile.tsx
export function MobileAIChat() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useMessagesState();
  
  return (
    <div className="sm:hidden">
      {/* Floating action button */}
      {!isExpanded && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "fixed bottom-20 right-4 z-50",
            "h-14 w-14 rounded-full bg-[#DB802D] text-white shadow-lg",
            "flex items-center justify-center",
            "touch-manipulation focus:ring-2 focus:ring-[#DB802D] focus:ring-offset-2"
          )}
        >
          <MessageSquare className="h-6 w-6" />
          {/* Notification badge */}
          {hasNewMessages && (
            <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}
      
      {/* Full-screen chat interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-[#DB802D] rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Assistant</h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <MobileChatMessage key={message.id} message={message} />
              ))}
            </div>
            
            {/* Chat input */}
            <div className="p-4 border-t bg-white">
              <MobileChatInput onSend={sendMessage} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Mobile Data Tables
```typescript
// components/mobile-data-table.tsx
export function MobileDataTable<T>({ data, columns }: MobileDataTableProps<T>) {
  return (
    <div className="sm:hidden space-y-4">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white border rounded-lg p-4 shadow-sm"
        >
          {/* Card-based layout for mobile */}
          <div className="space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">
                  {column.header}
                </span>
                <span className="text-sm text-gray-900 text-right max-w-[60%]">
                  {column.render ? column.render(item[column.key]) : item[column.key]}
                </span>
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
              View
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
```

### Mobile Search Interface
```typescript
// components/mobile-search.tsx
export function MobileSearch({ onSearch, placeholder }: MobileSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  return (
    <div className="sm:hidden">
      {!isExpanded ? (
        // Collapsed search icon
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-10 w-10 p-0"
        >
          <Search className="h-5 w-5" />
        </Button>
      ) : (
        // Expanded search bar
        <motion.div
          initial={{ width: 40 }}
          animate={{ width: '100%' }}
          className="flex items-center space-x-2"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch(query)}
              placeholder={placeholder}
              className="pl-10 pr-4 h-10 text-base"
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-10 w-10 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
```

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: March 2025