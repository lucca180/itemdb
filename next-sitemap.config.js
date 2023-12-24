/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 1000,
  changefreq: 'weekly',
  exclude: ['/sitemaps/*', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://itemdb.com.br/sitemaps/index.xml',
      ...Array.from({ length: 80 }, (_, i) => `https://itemdb.com.br/sitemaps/${i}.xml`),
    ],
    policies: [
      {
        userAgent: '*',
        disallow: ['/admin/*', '/search/*', '/api/*'],
      },
    ],
  },
  // ...other options
};
