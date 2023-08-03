/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

/**
 * @type {import('next').NextConfig}
 */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  images: {
    domains: ['images.neopets.com', 'magnetismotimes.com'],
  },
  distDir: process.env.BUILD_DIR || '.next',
  experimental:
    process.env.NODE_ENV === 'production'
      ? {
          isrMemoryCacheSize: 0,
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
      {
        source: '/api/v1/search/:slug*',
        destination: '/api/search/:slug*',
        permanent: false,
      },
    ];
  },
  transpilePackages: ['lightweight-charts', 'fancy-canvas'],
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
