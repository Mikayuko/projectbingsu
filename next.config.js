/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image configuration
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  // Ignore backend directory
  webpack: (config, { isServer }) => {
    // Ignore backend files during build
    config.watchOptions = {
      ignored: ['**/backend/**', '**/node_modules/**']
    };
    return config;
  },

  // TypeScript config
  typescript: {
    // ⚠️ เปลี่ยนเป็น true ถ้ามี TS errors ที่แก้ไม่ได้
    ignoreBuildErrors: false,
  },

  // ESLint config
  eslint: {
    // ⚠️ เปลี่ยนเป็น true ถ้ามี ESLint errors
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;