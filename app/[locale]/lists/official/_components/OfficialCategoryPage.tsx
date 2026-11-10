import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getOfficialCategory } from '@app/[locale]/lists/official/_categories';
import { resolveCategory } from '@app/[locale]/lists/official/_categories/resolve';
import {
  loadOfficialCategoryArticles,
  loadOfficialCategoryLists,
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
  const [lists, related] = await Promise.all([
    loadOfficialCategoryLists(category.slug),
    loadOfficialCategoryArticles(category.slug),
  ]);
  const resolved = resolveCategory(category, lists);

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
      />
    </>
  );
}
