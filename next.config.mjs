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
  },
  // Minimal experimental features to reduce conflicts
  experimental: {
    // Disable turbo for now to avoid potential issues
  },
  // Force dynamic rendering for all pages
  output: 'standalone',
  trailingSlash: false,
  // Increase timeout for static page generation
  staticPageGenerationTimeout: 120,
  // Basic optimizations
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Redirect rules to prevent build failures
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
    ];
  },
}

export default nextConfig