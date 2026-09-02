import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import {
  getItemDbCanonical,
  getStaticAppMetadata,
  normalizeItemDbLocale,
} from '@app/utils/appPage';
import { wp_getBySlug } from '@pages/api/wp/posts/[slug]';
import { wp_getLatestPosts } from '@pages/api/wp/posts';

import type { WP_Article } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { toIso8601Utc } from '@utils/isoDate';
import { formatArticleJsonLd, stringifyJsonLd } from '../articleJsonLd';
import { ArticlePageContent } from './ArticlePageContent';
import { buildArticlePageProps, getArticleMainColor } from './buildArticlePageProps';

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadArticle(slug);
  if (!post) return {};

  const metadata = await getStaticAppMetadata({
    title: post.title,
    description: post.excerpt,
    pathname: `/articles/${slug}`,
    noindex: post.category?.toLowerCase() === 'hidden',
  });
  const datePublished = toIso8601Utc(post.date);
  const dateModified = toIso8601Utc(post.updated) ?? datePublished;

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      ...(datePublished ? { publishedTime: datePublished } : {}),
      ...(dateModified ? { modifiedTime: dateModified } : {}),
      ...(post.thumbnail
        ? { images: [{ url: post.thumbnail, width: 150, height: 150, alt: post.title }] }
        : {}),
    },
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ArticlePageContentWrapper params={params} />
    </Suspense>
  );
}

async function ArticlePageContentWrapper({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const post = await loadArticle(slug);
  if (!post) notFound();

  const [labels, recommendations] = await Promise.all([
    buildArticlePageProps(post),
    loadArticleRecommendations(post.id),
  ]);
  const articleJsonLd = formatArticleJsonLd({
    post,
    canonical: getItemDbCanonical(`/articles/${post.slug}`, normalizeItemDbLocale(locale)),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(articleJsonLd) }}
      />
      <SetMainColor color={getArticleMainColor(post)} />
      <ArticlePageContent
        locale={locale}
        post={post}
        recommendations={recommendations}
        labels={labels}
      />
    </>
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
