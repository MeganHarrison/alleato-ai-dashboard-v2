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
  
  // Experimental features to reduce memory usage
  experimental: {
    // Reduce memory pressure during build
    optimizeServerReact: false,
    // Disable partial prerendering to reduce memory
    ppr: false,
    // Limit concurrent builds to reduce memory
    workerThreads: false,
    cpus: 1,
    // Optimize package imports
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@tanstack/react-table'
    ],
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
    
    // Simplified memory optimization for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
        },
      };
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