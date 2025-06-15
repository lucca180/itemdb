/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheMaxMemorySize: 0,
  productionBrowserSourceMaps: true,
  skipMiddlewareUrlNormalize: true,
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
        hostname: '**.neopets.com',
      },
      {
        protocol: 'https',
        hostname: '**.blogspot.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'https',
        hostname: '**.itemdb.com.br',
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
        source: '/items/:slug*',
        destination: '/item/:slug*',
        permanent: true,
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
      {
        source: '/tools/pet-colors',
        destination: '/tools/rainbow-pool/',
        permanent: true,
      },
      {
        source: '/owls/report',
        destination: '/mall/report/',
        permanent: true,
      },
      {
        source: '/api/v1/ncmall/:slug*',
        destination: '/api/v1/mall/:slug*',
        permanent: true,
      },
    ];
  },
  transpilePackages: ['lightweight-charts', 'fancy-canvas'],
  compiler: {
    define: {
      __SENTRY_DEBUG__: 'false',
      // __SENTRY_TRACING__: 'false',
      __RRWEB_EXCLUDE_IFRAME__: 'true',
      __RRWEB_EXCLUDE_SHADOW_DOM__: 'true',
      __SENTRY_EXCLUDE_REPLAY_WORKER__: 'true',
    },
  },
};

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: false,
// })

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  autoInstrumentMiddleware: false,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
