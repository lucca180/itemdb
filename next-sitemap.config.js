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
        '# As a condition of accessing this website, you agree to abide by',
        '# the following content signals:',
        '',
        '# (a)  If a content-signal = yes, you may collect content for the',
        '# corresponding use.',
        '# (b)  If a content-signal = no, you may not collect content for',
        '# the corresponding use.',
        '# (c)  If the website operator does not include a content signal',
        '# for a corresponding use, the website operator neither grants nor',
        '# restricts permission via content signal with respect to the',
        '# corresponding use.',
        '',
        '# The content signals and their meanings are:',
        '',
        '# search: building a search index and providing search results',
        '# (e.g., returning hyperlinks and short excerpts from your',
        "# website's contents).  Search does not include providing",
        '# AI-generated search summaries.',
        '# ai-input: inputting content into one or more AI models (e.g.,',
        '# retrieval augmented generation, grounding, or other real-time',
        '# taking of content for generative AI search answers).',
        '# ai-train: training or fine-tuning AI models.',
        '',
        '# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS',
        '# RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION',
        '# DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED RIGHTS IN THE',
        '# DIGITAL SINGLE MARKET.',
        '',
        '# *',
        'User-agent: *',
        'Content-Signal: ai-train=no, search=yes, ai-input=no',
        'Allow: /',
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
