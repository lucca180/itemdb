/** @type {import('next-sitemap').IConfig} */
/**
 * URL coverage lives in the dynamic sitemap at /sitemaps/index.xml.
 * next-sitemap only regenerates robots.txt — auto-crawled App Router paths
 * under [locale] previously produced broken /en/... URLs and hreflang="undefined".
 */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://itemdb.com.br',
  generateRobotsTxt: true,
  // Avoid a static sitemap index that nests /sitemaps/index.xml (invalid for Google).
  generateIndexSitemap: false,
  // Drop every auto-discovered path; dynamic sitemap owns all URL coverage.
  transform: async () => null,
  exclude: ['/sitemaps/*', '/admin/*', '/api/*', '/search/*', '/en/*', '/pt/en/*', '/pt/pt/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['*/admin/*', '*/api/*', '/search', '/pt/search'],
      },
    ],
    // Do not use additionalSitemaps — next-sitemap would nest that index inside
    // the static sitemap.xml. Write robots.txt ourselves instead.
    transformRobotsTxt: async () =>
      [
        '# *',
        'User-agent: *',
        'Disallow: */admin/*',
        'Disallow: */api/*',
        'Disallow: /search',
        'Disallow: /pt/search',
        '',
        '# Host',
        'Host: https://itemdb.com.br',
        '',
        '# Sitemaps',
        // Only the dynamic index — shard count is computed from DB at request time.
        'Sitemap: https://itemdb.com.br/sitemaps/index.xml',
        '',
      ].join('\n'),
  },
};
