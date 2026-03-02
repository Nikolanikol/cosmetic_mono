const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile TypeScript packages outside the app directory
  transpilePackages: ['@packages/types', '@packages/validators', '@packages/api'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Placeholder images for development
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Common product image CDNs
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      // Brand & retailer Shopify CDNs
      {
        protocol: 'https',
        hostname: 'sokoglam.com',
      },
      {
        protocol: 'https',
        hostname: 'beautyofjoseon.com',
      },
      // Google Cloud Storage (INCIDecoder, etc.)
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.storage.googleapis.com',
      },
      // Brand official sites
      {
        protocol: 'https',
        hostname: 'theordinary.com',
      },
      {
        protocol: 'https',
        hostname: 'www.cerave.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@packages/types': path.resolve(__dirname, '../../packages/types'),
      '@packages/validators': path.resolve(__dirname, '../../packages/validators'),
      '@packages/api': path.resolve(__dirname, '../../packages/api'),
    };
    return config;
  },
};

module.exports = nextConfig;
