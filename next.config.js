/* eslint-disable @typescript-eslint/no-var-requires */
// next.config.js

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    domains: ['images.neopets.com', 'magnetismotimes.com'],
  },
};

const withTM = require('next-transpile-modules')([
  'lightweight-charts',
  'fancy-canvas',
]);

module.exports = withTM(nextConfig);
