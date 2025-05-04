/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React's StrictMode
  reactStrictMode: true,
  // No trailing slash for API routes
  trailingSlash: false,
  // Configure rewrites to handle both /api and /_api paths
  async rewrites() {
    return [
      // Rewrite /_api/* requests to /api/*
      {
        source: '/_api/:path*',
        destination: '/api/:path*',
      }
    ];
  }
};

module.exports = nextConfig;