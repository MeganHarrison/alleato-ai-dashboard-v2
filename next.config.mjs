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
}

export default nextConfig