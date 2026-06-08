import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { ItemPage as ItemPageView } from '@app/_components/Item/page/ItemPage';
import { buildItemPageMetadata, getItemPageData, resolveItemRoute } from '@app/utils/loadItemPage';
import { setRequestLocale } from 'next-intl/server';
import { ItemData } from '@types';

type ItemPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const result = await resolveItemRoute(slug);

  if (result.type === 'notFound') {
    return {};
  }

  return buildItemPageMetadata(result.item, locale);
}

export default function ItemPage({ params }: ItemPageProps) {
  return (
    <Suspense fallback={null}>
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

  const item = result.item;
  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={item.color.hex + '66'}>
      <Suspense fallback={null}>
        <ItemPageData item={result.item} />
      </Suspense>
    </AppServerLayout>
  );
}

async function ItemPageData({ item }: { item: ItemData }) {
  const data = await getItemPageData(item);

  return <ItemPageView data={data} />;
}
