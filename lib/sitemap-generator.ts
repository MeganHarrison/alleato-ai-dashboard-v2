import fs from 'fs';
import path from 'path';

export interface PageInfo {
  path: string;
  title: string;
  category: string;
  description?: string;
  lastModified?: Date;
  priority?: number;
}

export interface SitemapCategory {
  name: string;
  icon?: string;
  pages: PageInfo[];
}

// Map of known page paths to their metadata
const pageMetadata: Record<string, Partial<PageInfo>> = {
  '/': { title: 'Home', category: 'Main', priority: 1.0 },
  '/projects-dashboard': { title: 'Projects Dashboard', category: 'Dashboards', priority: 0.9 },
  '/documents-db': { title: 'Documents Database', category: 'Databases', priority: 0.8 },
  '/clients': { title: 'Clients', category: 'Management', priority: 0.8 },
  '/employees': { title: 'Employees', category: 'Management', priority: 0.8 },
  '/diagnostic': { title: 'Diagnostic Tools', category: 'Tools', priority: 0.7 },
  '/meeting-intelligence': { title: 'Meeting Intelligence', category: 'AI Tools', priority: 0.8 },
  '/meeting-insights': { title: 'Meeting Insights', category: 'AI Tools', priority: 0.8 },
  '/team-chat': { title: 'Team Chat', category: 'Communication', priority: 0.7 },
  '/create-test-data': { title: 'Create Test Data', category: 'Development', priority: 0.5 },
  
  // ASRS/FM Global pages
  '/fm-8-34': { title: 'FM Global 8-34 Main', category: 'FM Global', priority: 0.9 },
  '/fm-8-34/tables': { title: 'FM Global Tables', category: 'FM Global', priority: 0.9 },
  '/fm-chat': { title: 'FM Global Chat', category: 'FM Global', priority: 0.8 },
  '/asrs-form': { title: 'ASRS Design Form', category: 'FM Global', priority: 0.8 },
  '/asrs-design': { title: 'ASRS Design Tool', category: 'FM Global', priority: 0.8 },
  
  // Project pages
  '/projects': { title: 'Projects', category: 'Projects', priority: 0.8 },
  '/projects-db': { title: 'Projects Database', category: 'Projects', priority: 0.8 },
  
  // Documentation
  '/docs': { title: 'Documentation', category: 'Documentation', priority: 0.7 },
  
  // PM Assistant
  '/pm-assistant': { title: 'PM Assistant', category: 'AI Tools', priority: 0.8 },
};

// Category order and icons
const categoryConfig: Record<string, { order: number; icon: string; description?: string }> = {
  'Main': { order: 1, icon: '🏠', description: 'Main navigation pages' },
  'Dashboards': { order: 2, icon: '📊', description: 'Data dashboards and analytics' },
  'FM Global': { order: 3, icon: '🔥', description: 'FM Global 8-34 ASRS tools and documentation' },
  'Projects': { order: 4, icon: '📁', description: 'Project management' },
  'AI Tools': { order: 5, icon: '🤖', description: 'AI-powered assistants and tools' },
  'Management': { order: 6, icon: '👥', description: 'Client and employee management' },
  'Databases': { order: 7, icon: '🗄️', description: 'Database interfaces' },
  'Communication': { order: 8, icon: '💬', description: 'Team communication tools' },
  'Tools': { order: 9, icon: '🔧', description: 'Utility and diagnostic tools' },
  'Documentation': { order: 10, icon: '📚', description: 'System documentation' },
  'Development': { order: 11, icon: '⚙️', description: 'Development utilities' },
  'Other': { order: 99, icon: '📄', description: 'Uncategorized pages' },
};

function getAllRoutes(dir: string, baseRoute = ''): string[] {
  const routes: string[] = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      // Skip special Next.js files and directories
      if (item.name.startsWith('_') || 
          item.name.startsWith('.') || 
          item.name === 'api' ||
          item.name === 'layout.tsx' ||
          item.name === 'layout.ts' ||
          item.name === 'layout.jsx' ||
          item.name === 'layout.js' ||
          item.name === 'error.tsx' ||
          item.name === 'loading.tsx' ||
          item.name === 'not-found.tsx' ||
          item.name === 'global-error.tsx' ||
          item.name === 'template.tsx' ||
          item.name === 'head.tsx' ||
          item.name === 'opengraph-image.tsx') {
        continue;
      }
      
      if (item.isDirectory()) {
        // Handle route groups (directories starting with parentheses)
        if (item.name.startsWith('(') && item.name.endsWith(')')) {
          // Route groups don't affect the URL
          routes.push(...getAllRoutes(path.join(dir, item.name), baseRoute));
        } else if (item.name.startsWith('[') && item.name.endsWith(']')) {
          // Dynamic routes - add as pattern
          const dynamicRoute = `${baseRoute}/${item.name}`;
          routes.push(dynamicRoute);
          // Also check for nested routes
          routes.push(...getAllRoutes(path.join(dir, item.name), dynamicRoute));
        } else {
          // Regular directory
          const newRoute = baseRoute ? `${baseRoute}/${item.name}` : `/${item.name}`;
          routes.push(...getAllRoutes(path.join(dir, item.name), newRoute));
        }
      } else if (item.name === 'page.tsx' || 
                 item.name === 'page.ts' || 
                 item.name === 'page.jsx' || 
                 item.name === 'page.js') {
        // Found a page file
        routes.push(baseRoute || '/');
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return routes;
}

export function generateSitemap(): SitemapCategory[] {
  const appDir = path.join(process.cwd(), 'app');
  const routes = getAllRoutes(appDir);
  
  // Filter out dynamic routes (those containing brackets)
  const staticRoutes = routes.filter(route => !route.includes('['));
  
  // Create PageInfo objects for all discovered routes
  const pages: PageInfo[] = staticRoutes.map(route => {
    const metadata = pageMetadata[route] || {};
    const pathSegments = route.split('/').filter(Boolean);
    
    // Generate title from path if not in metadata
    const title = metadata.title || 
      (pathSegments.length > 0 
        ? pathSegments[pathSegments.length - 1]
            .replace(/\[|\]/g, '') // Remove brackets from dynamic routes
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
        : 'Home');
    
    // Determine category
    let category = metadata.category || 'Other';
    
    // Auto-categorize based on path patterns
    if (!metadata.category) {
      if (route.includes('fm-') || route.includes('asrs')) {
        category = 'FM Global';
      } else if (route.includes('project')) {
        category = 'Projects';
      } else if (route.includes('meeting')) {
        category = 'AI Tools';
      } else if (route.includes('dashboard')) {
        category = 'Dashboards';
      } else if (route.includes('doc')) {
        category = 'Documentation';
      } else if (route.includes('test') || route.includes('diagnostic')) {
        category = 'Development';
      }
    }
    
    return {
      path: route,
      title,
      category,
      description: metadata.description,
      priority: metadata.priority || 0.5,
    };
  });
  
  // Group pages by category
  const categorizedPages: Record<string, PageInfo[]> = {};
  
  pages.forEach(page => {
    if (!categorizedPages[page.category]) {
      categorizedPages[page.category] = [];
    }
    categorizedPages[page.category].push(page);
  });
  
  // Sort pages within each category by priority and then title
  Object.keys(categorizedPages).forEach(category => {
    categorizedPages[category].sort((a, b) => {
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return a.title.localeCompare(b.title);
    });
  });
  
  // Create SitemapCategory objects
  const sitemapCategories: SitemapCategory[] = Object.entries(categorizedPages)
    .map(([name, pages]) => ({
      name,
      icon: categoryConfig[name]?.icon || '📄',
      pages,
    }))
    .sort((a, b) => {
      const orderA = categoryConfig[a.name]?.order || 99;
      const orderB = categoryConfig[b.name]?.order || 99;
      return orderA - orderB;
    });
  
  return sitemapCategories;
}

// Export category configuration for use in components
export { categoryConfig };