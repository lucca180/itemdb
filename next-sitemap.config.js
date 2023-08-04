/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 1000,
  changefreq: 'weekly',
  exclude: ['/sitemaps/*', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: ['https://itemdb.com.br/sitemaps/index.xml'],
  },
  // ...other options
};
