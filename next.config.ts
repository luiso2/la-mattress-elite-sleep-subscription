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
  // Headers for CORS and cache control
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
