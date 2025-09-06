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
  
  // Reduce memory usage during build
  output: 'standalone',
  
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
    
    // Aggressive memory optimization for production builds
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        splitChunks: isServer ? false : {
          chunks: 'all',
          maxSize: 200000, // Even smaller chunks for Vercel
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
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[\\/]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex').substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          maxAsyncRequests: 30,
          maxInitialRequests: 25,
        },
      };
      
      // Reduce memory usage during terser minification
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.parallel = 1;
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true,
              },
            };
          }
        });
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