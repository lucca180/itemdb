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
  async headers(){
    return [
      {
        source: '/api/v1/(.*)',
        headers: [
          {key: "Access-Control-Allow-Origin", value: "*"},
          {key: "Access-Control-Allow-Headers", value: "Content-Type"}
        ]
      }
    ]
  }
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

const withTM = require('next-transpile-modules')([
  'lightweight-charts',
  'fancy-canvas',
]);

module.exports = withSentryConfig(withTM(nextConfig), sentryWebpackPluginOptions);
