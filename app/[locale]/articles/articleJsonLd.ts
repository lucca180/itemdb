import { DEFAULT_OG_IMAGE } from '@utils/SEO';
import { SITE_URL } from '@utils/sitemap';
import { toIso8601Utc } from '@utils/isoDate';
import type { WP_Article } from '@types';

export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

type FormatArticleJsonLdInput = {
  post: WP_Article;
  canonical: string;
};

export function formatArticleJsonLd({ post, canonical }: FormatArticleJsonLdInput) {
  const datePublished = toIso8601Utc(post.date);
  const organization = {
    '@type': 'Organization',
    name: 'itemdb',
    url: SITE_URL,
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [post.thumbnail ?? DEFAULT_OG_IMAGE.url],
    datePublished,
    dateModified: toIso8601Utc(post.updated) ?? datePublished,
    // Articles are authored in English regardless of UI locale.
    inLanguage: 'en',
    author: organization,
    publisher: {
      ...organization,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_OG_IMAGE.url,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    url: canonical,
  };
}
