import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getPathname } from '@i18n/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { ItemPageClient } from '@app/_components/Item/ItemPageClient';
import { buildItemPageMetadata, resolveItemPage } from '@app/utils/itemPage';

export const revalidate = 60;

type ItemPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const result = await resolveItemPage(slug);

  if (result.type !== 'ok') {
    return {};
  }

  return buildItemPageMetadata(result.data.item, locale);
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug, locale } = await params;
  const result = await resolveItemPage(slug);

  if (result.type === 'redirect') {
    permanentRedirect(getPathname({ locale, href: result.href }));
  }

  if (result.type === 'notFound') {
    notFound();
  }

  const { item } = result.data;

  return (
    <AppServerLayout disableNextSeo mainColor={item.color.hex + '66'}>
      <ItemPageClient {...result.data} />
    </AppServerLayout>
  );
}
