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
  // Force dynamic rendering to prevent static generation failures
  output: 'standalone',
  // Basic optimizations for production
  poweredByHeader: false,
  compress: true,
  
  // Optimize bundle size
  productionBrowserSourceMaps: false,
  
  transpilePackages: [
    '@tanstack/react-table',
    '@tanstack/table-core',
  ],

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