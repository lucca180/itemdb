/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

/**
 * @type {import('next').NextConfig}
 */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
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
  experimental:
    process.env.NODE_ENV === 'production'
      ? {
          // isrMemoryCacheSize: 50,
        }
      : {},
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
        __SENTRY_TRACING__: false,
      })
    );

    // return the modified config
    return config;
  },
};

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
