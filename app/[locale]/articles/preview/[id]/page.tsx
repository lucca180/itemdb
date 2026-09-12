import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { wp_getPreviewById } from '@utils/wp/wpPreview';
import { verifyWpPreviewToken } from '@utils/wpPreviewToken';
import type { WP_Article } from '@types';
import { ArticlePageContent } from '../../[slug]/ArticlePageContent';
import { buildArticlePageProps, getArticleMainColor } from '../../[slug]/buildArticlePageProps';

export const instant = false;

type PreviewPageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ token?: string; exp?: string }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadPreviewPost(
  idParam: string,
  tokenParam: string | undefined,
  expParam: string | undefined
): Promise<WP_Article | null> {
  const id = parseInt(idParam, 10);
  const exp = parseInt(expParam ?? '', 10);
  const token = tokenParam ?? '';
  if (!Number.isFinite(id) || !verifyWpPreviewToken(id, token, exp)) return null;
  return wp_getPreviewById(id);
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;

  return getStaticAppMetadata({
    title: `Draft Preview #${id}`,
    pathname: `/articles/preview/${id}`,
    noindex: true,
    nofollow: true,
  });
}

export default function ArticlePreviewPage({ params, searchParams }: PreviewPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ArticlePreviewPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ArticlePreviewPageContent({ params, searchParams }: PreviewPageProps) {
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);

  const post = await loadPreviewPost(
    id,
    firstSearchParam(query.token),
    firstSearchParam(query.exp)
  );

  if (!post) notFound();

  const labels = await buildArticlePageProps(post);
  const lastCrumb = labels.breadcrumbList.at(-1);
  if (lastCrumb) lastCrumb.item = `/articles/preview/${id}`;

  return (
    <>
      <SetMainColor color={getArticleMainColor(post)} />
      <ArticlePageContent
        locale={locale}
        post={post}
        recommendations={[]}
        labels={labels}
        isPreview={true}
      />
    </>
  );
}
