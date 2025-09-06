/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow streaming responses
  compress: true,
  
  // Supabase image domains if needed
  images: {
    domains: ['your-project.supabase.co'],
  },
}

module.exports = nextConfig