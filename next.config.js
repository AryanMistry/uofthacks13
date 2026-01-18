/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment on Vultr
  output: 'standalone',
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  // Environment variables available to the browser
  env: {
    VULTR_DEPLOYMENT: process.env.VULTR_DEPLOYMENT || 'false',
  },
}

module.exports = nextConfig
