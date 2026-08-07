import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { ItemPage as ItemPageView } from '@app/_components/Item/page/ItemPage';
import { preloadItemPageData } from '@app/_components/Item/preloadItemPage';
import { buildItemPageMetadata, resolveItemRoute } from '@app/utils/loadItemPage';

import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';

type ItemPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const result = await resolveItemRoute(slug);

  if (result.type === 'notFound') {
    return {};
  }

  return buildItemPageMetadata(result.item, locale);
}

export default function ItemPage({ params }: ItemPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ItemPageRoute params={params} />
    </Suspense>
  );
}

async function ItemPageRoute({ params }: ItemPageProps) {
  const { slug, locale } = await params;
  const result = await resolveItemRoute(slug);

  if (result.type === 'redirect') {
    permanentRedirect(getPathname({ locale, href: result.href }));
  }

  if (result.type === 'notFound') {
    notFound();
  }

  preloadItemPageData(result.item);

  return (
    <>
      <SetMainColor color={result.item.color.hex + '66'} />
      <ItemPageView item={result.item} />
    </>
  );
}
