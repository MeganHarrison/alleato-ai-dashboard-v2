import { generateSitemap, categoryConfig } from '@/lib/sitemap-generator';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Grid3x3, 
  List, 
  ExternalLink,
  ChevronRight,
  FileText,
  Clock,
  Star
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SitemapPage() {
  const sitemapCategories = generateSitemap();
  const totalPages = sitemapCategories.reduce((acc, cat) => acc + cat.pages.length, 0);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Site Navigation Map
            </h1>
            <p className="text-lg text-gray-600">
              Complete overview of all {totalPages} pages and features available in the application
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-brand-600">{totalPages}</div>
            <div className="text-sm text-gray-500">Total Pages</div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {sitemapCategories.slice(0, 4).map(category => (
            <div key={category.name} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {category.pages.length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search for any page..."
            className="pl-10 pr-4 py-6 text-lg"
            id="sitemap-search"
          />
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="grid" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tree View
            </TabsTrigger>
          </TabsList>
          
          <Badge variant="secondary" className="text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Grid View */}
        <TabsContent value="grid" className="space-y-8">
          {sitemapCategories.map(category => (
            <div key={category.name} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-2xl font-semibold text-gray-900">{category.name}</h2>
                <Badge variant="secondary">{category.pages.length} pages</Badge>
                {categoryConfig[category.name]?.description && (
                  <span className="text-sm text-gray-500 ml-auto">
                    {categoryConfig[category.name].description}
                  </span>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.pages.map(page => (
                  <Link key={page.path} href={page.path} className="block group">
                    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-brand-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
                            {page.title}
                          </CardTitle>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600 transition-all group-hover:translate-x-1" />
                        </div>
                        <CardDescription className="text-xs mt-1">
                          {page.path}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {page.priority && page.priority >= 0.8 && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Priority
                            </Badge>
                          )}
                          {page.path.includes('[') && (
                            <Badge variant="outline" className="text-xs">
                              Dynamic
                            </Badge>
                          )}
                          {page.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {page.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>
                Complete list of all pages in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {sitemapCategories.map(category => (
                  <div key={category.name} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{category.icon}</span>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {category.pages.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 ml-7">
                      {category.pages.map(page => (
                        <Link
                          key={page.path}
                          href={page.path}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />
                            <div>
                              <div className="font-medium text-gray-900 group-hover:text-brand-600">
                                {page.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {page.path}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {page.priority && page.priority >= 0.8 && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tree View */}
        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle>Site Structure</CardTitle>
              <CardDescription>
                Hierarchical view of the application structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm space-y-4">
                <div>
                  <div className="font-bold text-gray-900 mb-2">📁 /</div>
                  {sitemapCategories.map((category, catIndex) => (
                    <div key={category.name} className="ml-4">
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-gray-400">
                          {catIndex === sitemapCategories.length - 1 ? '└──' : '├──'}
                        </span>
                        <span>{category.icon}</span>
                        <span className="font-semibold text-gray-700">
                          {category.name}
                        </span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {category.pages.length}
                        </Badge>
                      </div>
                      <div className={catIndex === sitemapCategories.length - 1 ? 'ml-4' : 'ml-4 border-l border-gray-300'}>
                        {category.pages.map((page, pageIndex) => (
                          <Link
                            key={page.path}
                            href={page.path}
                            className="flex items-center gap-2 py-1 pl-4 hover:bg-gray-50 transition-colors group"
                          >
                            <span className="text-gray-400">
                              {pageIndex === category.pages.length - 1 ? '└──' : '├──'}
                            </span>
                            <span className="text-brand-600 group-hover:underline">
                              {page.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({page.path})
                            </span>
                            {page.priority && page.priority >= 0.8 && (
                              <Star className="h-3 w-3 text-yellow-500 ml-1" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>
          This sitemap is automatically generated from the application's file structure.
        </p>
        <p className="mt-2">
          Pages marked with <Star className="h-3 w-3 inline text-yellow-500" /> are high-priority pages.
        </p>
      </div>

      {/* Search Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if (typeof document !== 'undefined') {
            document.addEventListener('DOMContentLoaded', function() {
              const searchInput = document.getElementById('sitemap-search');
              if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                  const searchTerm = e.target.value.toLowerCase();
                  const cards = document.querySelectorAll('[data-page-title]');
                  
                  cards.forEach(card => {
                    const title = card.getAttribute('data-page-title').toLowerCase();
                    const path = card.getAttribute('data-page-path').toLowerCase();
                    const category = card.getAttribute('data-page-category').toLowerCase();
                    
                    if (title.includes(searchTerm) || 
                        path.includes(searchTerm) || 
                        category.includes(searchTerm)) {
                      card.style.display = '';
                    } else {
                      card.style.display = 'none';
                    }
                  });
                  
                  // Hide empty categories
                  const categories = document.querySelectorAll('[data-category]');
                  categories.forEach(cat => {
                    const visibleCards = cat.querySelectorAll('[data-page-title]:not([style*="display: none"])');
                    if (visibleCards.length === 0) {
                      cat.style.display = 'none';
                    } else {
                      cat.style.display = '';
                    }
                  });
                });
              }
            });
          }
        `
      }} />
    </div>
  );
}