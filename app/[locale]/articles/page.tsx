import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { wp_getLatestPosts } from '@pages/api/wp/posts';
import { getTranslations } from 'next-intl/server';
import type { WP_Article } from '@types';
import { ArticlesPageContent } from './ArticlesPageContent';
import { buildArticlesPageProps } from './buildArticlesPageProps';

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

export default function ArticlesPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ArticlesPageContentWrapper />
    </Suspense>
  );
}

async function ArticlesPageContentWrapper() {
  const [labels, groupedPosts] = await Promise.all([
    buildArticlesPageProps(),
    loadGroupedArticles(),
  ]);
  return (
    <>
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
    if (!groupedPosts[category]) {
      groupedPosts[category] = [];
    }
    groupedPosts[category].push(post);
  });

  return groupedPosts;
}
