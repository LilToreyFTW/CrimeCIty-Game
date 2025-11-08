/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  // Enable static file serving
  output: 'standalone',
  // Serve static files from public directory
  publicRuntimeConfig: {
    // Add any runtime config here
  },
}

module.exports = nextConfig
