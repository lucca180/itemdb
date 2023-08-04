/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 7000,
  changefreq: 'weekly',
  exclude: ['/server-sitemap-index.xml', '/server-sitemap.xml', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://itemdb.com.br/server-sitemap-index.xml',
      'https://itemdb.com.br/server-sitemap.xml',
    ],
  },
  // ...other options
};
