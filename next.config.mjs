import { createHash } from 'crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lgveqfnpkxvzbnnwuled.supabase.co',
      },
    ],
  },
  // Basic optimizations for production
  poweredByHeader: false,
  compress: true,
  
  // Remove standalone for Vercel deployment
  // output: 'standalone', // Commented out for Vercel
  
  // Optimize bundle size
  productionBrowserSourceMaps: false,
  
  // Experimental features for faster builds
  experimental: {
    // Enable turbo for faster builds on Vercel
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    },
    // Optimize server components
    serverComponentsExternalPackages: [
      '@supabase/supabase-js',
      'pdfjs-dist',
      'sharp'
    ],
    // Optimize package imports for faster bundling
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog', 
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
      'date-fns'
    ],
    // Enable faster bundling
    bundlePagesRouterDependencies: true,
    // Optimize concurrent processing
    cpus: 2,
    // Enable webpack cache
    webpackBuildWorker: true,
  },
  
  transpilePackages: [
    '@tanstack/react-table',
    '@tanstack/table-core',
  ],
  
  webpack: (config, { isServer, dev }) => {
    // Add alias for Zod v4 compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'zod/v4': 'zod',
    };
    
    // Suppress the critical dependency warning for Supabase realtime
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    // Fix ESM parsing issues for @tanstack/react-table and other packages
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Specifically handle @tanstack/react-table ESM imports
    config.module.rules.push({
      test: /node_modules\/@tanstack\/react-table\/.*\.js$/,
      type: 'javascript/esm',
    });
    
    // Configure to handle ESM modules properly
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    
    // Optimized build configuration for faster builds
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: '.next/cache/webpack',
        buildDependencies: {
          config: [__filename],
        },
      };
      
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          minimize: true,
          usedExports: true,
          splitChunks: {
            chunks: 'all',
            maxSize: 300000,
            minSize: 20000,
            cacheGroups: {
              framework: {
                name: 'framework',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 40,
                enforce: true,
                reuseExistingChunk: true,
              },
              vendor: {
                name: 'vendor',
                test: /[\\/]node_modules[\\/]/,
                priority: 20,
                reuseExistingChunk: true,
                maxSize: 200000,
              },
            },
          },
        };
      }
    }
    
    // Optimize for memory usage in serverless environment
    config.optimization = {
      ...config.optimization,
      splitChunks: isServer ? false : config.optimization.splitChunks,
    };
    
    // Alternative approach using webpack ignore plugin
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
}

export default nextConfig