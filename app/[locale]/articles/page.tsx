import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import {
  getItemDbCanonical,
  getStaticAppMetadata,
  normalizeItemDbLocale,
} from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { wp_getLatestPosts } from '@pages/api/wp/posts';
import { getTranslations } from 'next-intl/server';
import type { WP_Article } from '@types';
import { ArticlesPageContent } from './ArticlesPageContent';
import { buildArticlesPageProps } from './buildArticlesPageProps';
import { stringifyJsonLd } from './articleJsonLd';

const mainColor = '#E4DA0A6b';
const headerImage = 'https://images.neopets.com/nt/ntimages/94_acara_type.gif';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('Articles.all-articles'),
    pathname: '/articles',
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [
        {
          url: headerImage,
          width: 150,
          height: 150,
          alt: t('Articles.all-articles'),
        },
      ],
    },
  };
}

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

export default function ArticlesPage({ params }: ArticlesPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ArticlesPageContentWrapper params={params} />
    </Suspense>
  );
}

async function ArticlesPageContentWrapper({ params }: ArticlesPageProps) {
  const { locale } = await params;
  const [labels, groupedPosts] = await Promise.all([
    buildArticlesPageProps(),
    loadGroupedArticles(),
  ]);
  const normalizedLocale = normalizeItemDbLocale(locale);
  const canonical = getItemDbCanonical('/articles', normalizedLocale);
  const posts = Object.values(groupedPosts).flat();
  const articlesIndexJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: labels.title,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: getItemDbCanonical(`/articles/${post.slug}`, normalizedLocale),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(articlesIndexJsonLd) }}
      />
      <SetMainColor color={mainColor} />
      <ArticlesPageContent labels={labels} groupedPosts={groupedPosts} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadGroupedArticles(): Promise<Record<string, WP_Article[]>> {
  'use cache';
  cacheTag('articles-index');
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  const allPosts = await wp_getLatestPosts(100).catch(() => []);
  const groupedPosts: Record<string, WP_Article[]> = {};

  allPosts.forEach((post) => {
    const category = post.category || 'Uncategorized';
    if (category.toLowerCase() === 'hidden') return;
    if (!groupedPosts[category]) {
      groupedPosts[category] = [];
    }
    groupedPosts[category].push(post);
  });

  return groupedPosts;
}
