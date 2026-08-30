import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { getCachedNow } from '@utils/getCachedNow';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { WP_Article } from '@types';

export type ArticlePageLabels = {
  breadcrumbList: BreadcrumbItem[];
  postedAt: string;
  updatedAt: string;
  recommendedArticles: string;
};

export async function buildArticlePageProps(post: WP_Article): Promise<ArticlePageLabels> {
  const [t, formatter, now] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getCachedNow(),
  ]);

  return {
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Layout.articles'), item: '/articles' },
      { position: 4, name: post.title, item: `/articles/${post.slug}` },
    ],
    postedAt: t('Articles.posted-at-date', {
      date: formatter.dateTime(new Date(post.date), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }),
    updatedAt: t('Articles.updated-x', {
      x: formatter.relativeTime(new Date(post.updated), new Date(now)),
    }),
    recommendedArticles: t('Articles.recommended-articles'),
  };
}

export function getArticleMainColor(post: WP_Article) {
  return `${post.palette?.vibrant.hex ?? '#05B7E8'}6b`;
}
