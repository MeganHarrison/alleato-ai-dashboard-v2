/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED: Stop ignoring errors - this was masking real issues!
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lgveqfnpkxvzbnnwuled.supabase.co',
      },
    ],
  },
  // Stability-focused experimental features
  experimental: {
    // Enable better error reporting
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Note: turbo disabled by not including it (Next.js 15.0.3 issue)
  },
  // Force dynamic rendering for all pages
  output: 'standalone',
  trailingSlash: false,
  // Increase timeout for static page generation
  staticPageGenerationTimeout: 120,
  // Basic optimizations for production
  poweredByHeader: false,
  compress: true,
  
  // Optimize bundle size
  productionBrowserSourceMaps: false,
  
  transpilePackages: [
    '@tanstack/react-table',
    '@tanstack/table-core',
    '@ai-sdk/react',
    '@supabase/ssr',
  ],

  // Webpack optimization to prevent memory issues
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }

    // Prevent memory leaks in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    return config;
  },

  // Add redirects for deleted routes
  async redirects() {
    return [
      {
        source: '/asrs3',
        destination: '/',
        permanent: false,
      },
      {
        source: '/asrs3/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/insights6',
        destination: '/',
        permanent: false,
      },
      {
        source: '/insights6/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
}

export default nextConfig