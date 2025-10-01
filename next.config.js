/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Experimental features
  experimental: {
    // Add experimental features here if needed
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        pg: false,
        'pg-hstore': false,
        'pg-native': false,
      };
    }
    // Ignore sequelize dynamic requires
    config.externals = [...(config.externals || []), 'sequelize'];

    return config;
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

module.exports = nextConfig;
