import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for development
  generateBuildId: async () => {
    return Date.now().toString();
  },
  // Disable static optimization
  reactStrictMode: true,
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable caching completely
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // Headers for CORS and cache control
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default nextConfig;
