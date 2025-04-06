/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 20000,
  changefreq: 'weekly',
  alternateRefs: [{ href: 'https://itemdb.com.br/pt', hrefLang: 'pt' }],
  exclude: ['/sitemaps/*', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://itemdb.com.br/sitemaps/index.xml',
      ...Array.from({ length: 25 }, (_, i) => `https://itemdb.com.br/sitemaps/${i}.xml`),
    ],
    policies: [
      {
        userAgent: '*',
        disallow: ['*/admin/*', '*/search*', '*/api/*'],
      },
    ],
  },
  // ...other options
};
