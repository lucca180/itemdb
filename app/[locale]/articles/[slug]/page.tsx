import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { wp_getBySlug } from '@pages/api/wp/posts/[slug]';
import { wp_getLatestPosts } from '@pages/api/wp/posts';
import { setRequestLocale } from 'next-intl/server';
import type { WP_Article } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { ArticlePageContent } from './ArticlePageContent';
import { buildArticlePageProps, getArticleMainColor } from './buildArticlePageProps';

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await loadArticle(slug);
  if (!post) return {};

  const pageProps = getStaticAppPageProps(locale, {
    title: post.title,
    description: post.excerpt,
    pathname: `/articles/${slug}`,
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [{ url: post.thumbnail ?? '', width: 150, height: 150, alt: post.title }],
    },
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor="#05B7E86b" />}>
      <ArticlePageContentWrapper params={params} />
    </Suspense>
  );
}

async function ArticlePageContentWrapper({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await loadArticle(slug);
  if (!post) notFound();

  const [labels, recommendations] = await Promise.all([
    buildArticlePageProps(post),
    loadArticleRecommendations(post.id),
  ]);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={getArticleMainColor(post)}>
      <ArticlePageContent
        locale={locale}
        post={post}
        recommendations={recommendations}
        labels={labels}
      />
    </AppServerLayout>
  );
}

const loadArticle = cache(async (slug: string): Promise<WP_Article | null> => {
  'use cache';
  cacheTag(fitCacheTag(`article-${slug}`));
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  return wp_getBySlug(slug);
});

async function loadArticleRecommendations(postId: number): Promise<WP_Article[]> {
  'use cache';
  cacheTag('article-recommendations');
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  let recommended = await wp_getLatestPosts(100, 1, true);
  const Chance = (await import('chance')).default;
  recommended = new Chance().shuffle(recommended);

  return recommended.filter((article) => article.id !== postId);
}
