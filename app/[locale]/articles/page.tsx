import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { wp_getLatestPosts } from '@pages/api/wp/posts';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { WP_Article } from '@types';
import { ArticlesPageContent } from './ArticlesPageContent';
import { buildArticlesPageProps } from './buildArticlesPageProps';
const mainColor = '#E4DA0A6b';
const headerImage = 'https://images.neopets.com/nt/ntimages/94_acara_type.gif';

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('Articles.all-articles'),
    pathname: '/articles',
  });

  return {
    ...pageProps.metadata,
    themeColor: '#E4DA0A',
    openGraph: {
      ...pageProps.metadata.openGraph,
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

export default function ArticlesPage({ params }: ArticlesPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <ArticlesPageContentWrapper params={params} />
    </Suspense>
  );
}

async function ArticlesPageContentWrapper({ params }: ArticlesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [labels, groupedPosts] = await Promise.all([
    buildArticlesPageProps(),
    loadGroupedArticles(),
  ]);
  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <ArticlesPageContent labels={labels} groupedPosts={groupedPosts} />
    </AppServerLayout>
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
