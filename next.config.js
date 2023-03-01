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

const withTM = require('next-transpile-modules')([
  'lightweight-charts',
  'fancy-canvas',
]);

module.exports = withTM(nextConfig);
