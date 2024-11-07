/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheMaxMemorySize: 0,
  productionBrowserSourceMaps: true,
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
    reactCompiler: true,
    largePageDataBytes: 512 * 1000,
    optimizePackageImports: [
      '@sentry/nextjs',
      'axios',
      'framer-motion',
      '@chakra-ui/react',
      '@chakra-ui/icons',
      'firebase',
      'lightweight-charts',
      'lodash',
      '@emotion/react',
      '@emotion/styled',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
  },
  async headers() {
    return [
      {
        // list more extensions here if needed; these are all the resources in the `public` folder including the subfolders
        source: '/:all*(svg|jpg|png|gif|ttf|ico)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate',
          },
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
      {
        source: '/api/search/:slug*',
        destination: '/api/v1/search/:slug*',
        permanent: true,
      },
      {
        source: '/hub/faeriefestival2023',
        destination: '/hub/faeriefestival',
        permanent: true,
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

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: false,
// })

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
