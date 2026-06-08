import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { ItemPage as ItemPageView } from '@app/_components/Item/page/ItemPage';
import { buildItemPageMetadata, resolveItemPage, resolveItemRoute } from '@app/utils/loadItemPage';
import { setRequestLocale } from 'next-intl/server';

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
      <ItemPageContent params={params} />
    </Suspense>
  );
}

async function ItemPageContent({ params }: ItemPageProps) {
  const { slug, locale } = await params;
  const result = await resolveItemPage(slug);

  if (result.type === 'redirect') {
    permanentRedirect(getPathname({ locale, href: result.href }));
  }

  if (result.type === 'notFound') {
    notFound();
  }

  setRequestLocale(locale);

  const { item } = result.data;

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={item.color.hex + '66'}>
      <ItemPageView data={result.data} />
    </AppServerLayout>
  );
}
