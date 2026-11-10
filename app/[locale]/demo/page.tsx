import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { wp_getLatestPosts } from '@pages/api/wp/posts';
import { ListService } from '@services/ListService';
import type { WP_Article } from '@types';
import { demoCategorySlugs, getCategoryConfig, officialCategories } from './_categories';
import { resolveCategory } from './_categories/resolve';
import { OfficialCatDemoClient } from './OfficialCatDemoClient';

type DemoPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Official list category — demo',
    description: 'Demo',
    pathname: '/demo',
    noindex: true,
    nofollow: true,
  });
}

export default function OfficialCatDemoPage(props: DemoPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <OfficialCatDemoContent {...props} />
    </Suspense>
  );
}

async function OfficialCatDemoContent({ params, searchParams }: DemoPageProps) {
  const { locale } = await params;
  const { cat } = await searchParams;
  const config = getCategoryConfig(cat ?? 'quest-log') ?? getCategoryConfig('quest-log')!;

  const [lists, related] = await Promise.all([
    loadCategoryLists(config.tags.join(',')),
    loadRelatedPosts(),
  ]);

  const resolved = resolveCategory(config, lists);

  return (
    <>
      <SetMainColor color={config.color + 'c7'} />
      <OfficialCatDemoClient
        locale={locale}
        config={config}
        lists={lists}
        resolved={resolved}
        related={related}
        categories={demoCategorySlugs.map((slug) => {
          const c = getCategoryConfig(slug)!;
          return { slug, name: c.name, color: c.color, configured: !!officialCategories[slug] };
        })}
      />
    </>
  );
}

async function loadCategoryLists(tags: string) {
  'use cache';
  cacheLife('homeSection');
  return ListService.init().getOfficialListsCat(tags, 3000);
}

async function loadRelatedPosts(): Promise<WP_Article[]> {
  'use cache';
  cacheLife('hours');
  return wp_getLatestPosts(3, 1, true).catch(() => []);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
