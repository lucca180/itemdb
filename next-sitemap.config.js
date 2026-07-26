/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 20000,
  changefreq: 'weekly',
  alternateRefs: [{ href: 'https://itemdb.com.br/pt', hrefLang: 'pt' }],
  exclude: ['/sitemaps/*', '/admin/*'], // <= exclude here
  robotsTxtOptions: {
    // Only the dynamic index — shard count is computed from DB at request time.
    // Listing fixed /sitemaps/0..N.xml here goes stale when item volume changes.
    additionalSitemaps: ['https://itemdb.com.br/sitemaps/index.xml'],
    policies: [
      {
        userAgent: '*',
        disallow: ['*/admin/*', '*/api/*', '*/search/*'],
      },
    ],
  },
  // ...other options
};
