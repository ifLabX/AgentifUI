import withBundleAnalyzer from '@next/bundle-analyzer';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import pkg from './package.json';

/**
 * Next.js Configuration
 * @description Configure Next.js with traditional webpack to avoid Turbopack font loading issues
 * Integrate next-intl plugin for internationalization support
 * Additional configuration for cross-origin requests and production optimizations
 */

const withNextIntl = createNextIntlPlugin();

// Bundle analyzer for production optimization
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */

  // Inject version information for frontend display
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  // Enable standalone output only when explicitly requested
  output:
    process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : undefined,

  // Allow cross-origin requests from specific domains during development
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS
    ? process.env.DEV_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [],

  // Automatically remove console.log in production
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'], // Keep console.error and console.warn
          }
        : false,
  },

  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build (optional)
  typescript: {
    ignoreBuildErrors: false, // Set to true to ignore TS errors as well
  },

  // Webpack configuration: Fix Supabase Realtime WebSocket issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side: Ensure WebSocket dependencies load correctly
      config.externals = config.externals || [];
      config.externals.push({
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }

    // Ignore Supabase Realtime dynamic import warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },

  // Use traditional webpack for proper font loading
};

export default bundleAnalyzer(withNextIntl(nextConfig));
