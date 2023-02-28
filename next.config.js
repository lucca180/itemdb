/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    domains: ['images.neopets.com', 'magnetismotimes.com'],
  },
  distDir: process.env.BUILD_DIR || '.next',
};

const withTM = require('next-transpile-modules')([
  'lightweight-charts',
  'fancy-canvas',
]);

module.exports = withTM(nextConfig);
