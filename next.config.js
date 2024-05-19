/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheMaxMemorySize: 0,
  i18n: {
    locales: ['en', 'pt'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  images: {
    // domains: ['images.neopets.com', 'magnetismotimes.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'magnetismotimes.com',
      },
      {
        protocol: 'https',
        hostname: 'images.neopets.com',
      },
    ],
    minimumCacheTTL: 2592000,
  },
  distDir: process.env.BUILD_DIR || '.next',
  experimental: {
    largePageDataBytes: 512 * 1000,
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/api/v1/cache/:slug*',
        destination: '/api/cache/:slug*',
        permanent: false,
      },
    ];
  },
  transpilePackages: ['lightweight-charts', 'fancy-canvas'],
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __SENTRY_DEBUG__: false,
        // __SENTRY_TRACING__: false,
      })
    );
    return config;
  },
};

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
