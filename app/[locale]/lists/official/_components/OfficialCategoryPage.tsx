import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import type { UserList } from '@types';
import { getTranslations } from 'next-intl/server';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getOfficialCategory } from '@app/[locale]/lists/official/_categories';
import { needsPageviews, resolveCategory } from '@app/[locale]/lists/official/_categories/resolve';
import {
  groupStampAlbums,
  isStampsCategory,
  type StampAlbums,
} from '@app/[locale]/lists/official/_categories/stamps';
import type { OfficialCategoryConfig } from '@app/[locale]/lists/official/_categories/types';
import {
  loadOfficialCategoryArticles,
  loadOfficialCategoryLists,
  loadOfficialListPageviews,
  loadStampAlbums,
} from '@app/[locale]/lists/official/loadOfficialLists';
import { OfficialCategoryClient } from './OfficialCategoryClient';

/**
 * Shared by the static category routes (`app/[locale]/lists/official/<slug>/page.tsx`). Each
 * category has its own folder: a static segment wins over `/lists/[username]/[list_id]`, so
 * official list pages keep their own route untouched.
 */

type OfficialCategoryRouteProps = {
  slug: string;
  params: Promise<{ locale: string }>;
};

const requireCategory = (slug: string) => {
  const category = getOfficialCategory(slug);
  if (!category) throw new Error(`Official category "${slug}" is not in the registry`);
  return category;
};

export function officialCategoryStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateOfficialCategoryMetadata(slug: string): Promise<Metadata> {
  const category = requireCategory(slug);
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: category.seoTitle ?? `${category.name} - ${t('General.official-lists')}`,
    description: category.description,
    pathname: `/lists/official/${category.slug}`,
  });

  return {
    ...metadata,
    ...(category.seoTitle ? { title: { absolute: category.seoTitle } } : {}),
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: category.image }],
    },
  };
}

export function OfficialCategoryRoute(props: OfficialCategoryRouteProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <OfficialCategoryContent {...props} />
    </Suspense>
  );
}

async function OfficialCategoryContent({ slug, params }: OfficialCategoryRouteProps) {
  const { locale } = await params;
  const category = requireCategory(slug);
  const [lists, related, albums] = await Promise.all([
    loadOfficialCategoryLists(category.slug),
    loadOfficialCategoryArticles(category.slug),
    isStampsCategory(category) ? loadStampAlbums() : undefined,
  ]);
  const base = resolveCategory(category, lists);
  const resolved = albums ? groupStampAlbums(base, albums) : base;
  // Not awaited: the client streams these cards in after the shell.
  const popular = needsPageviews(category) ? loadPopularLists(category, lists, albums) : undefined;

  const faqJsonLd = category.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: category.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <>
      <SetMainColor color={category.color + 'c7'} />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <OfficialCategoryClient
        locale={locale}
        config={category}
        lists={lists}
        resolved={resolved}
        related={related}
        albums={albums}
        popular={popular}
      />
    </>
  );
}

/**
 * `featured.popular` lists, resolved at request time only (`connection()`), so they stream
 * after the shell. The 30-day Umami query takes seconds when its cache entry is cold or past
 * `revalidate`, and a shell regeneration would wait on it; request-time reads serve the stale
 * entry and refresh it in the background.
 */
async function loadPopularLists(
  category: OfficialCategoryConfig,
  lists: UserList[],
  albums?: StampAlbums
): Promise<UserList[]> {
  await connection();
  const base = resolveCategory(category, lists, await loadOfficialListPageviews());
  const resolved = albums ? groupStampAlbums(base, albums) : base;
  return resolved.type === 'groups' ? resolved.featured.popular : [];
}
