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
  // Use Turbopack for production builds to bypass webpack issues
  experimental: {
    turbo: {},
  },
  // Basic optimizations for production
  poweredByHeader: false,
  compress: true,
  
  // Optimize bundle size
  productionBrowserSourceMaps: false,
  
  transpilePackages: [
    '@tanstack/react-table',
    '@tanstack/table-core',
  ],
}

export default nextConfig