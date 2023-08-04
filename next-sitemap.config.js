/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 1000,
  changefreq: 'weekly',
  exclude: ['/sitemaps/index.xml', '/sitemaps-index/index.xml', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://itemdb.com.br/sitemaps/index.xml',
      'https://itemdb.com.br/sitemaps-index/index.xml',
    ],
  },
  // ...other options
};
