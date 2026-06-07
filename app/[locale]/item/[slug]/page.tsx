import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { ItemPage as ItemPageView } from '@app/_components/Item/page/ItemPage';
import { buildItemPageMetadata, resolveItemPage, resolveItemRoute } from '@app/utils/loadItemPage';

export const revalidate = 60;

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
      <ItemPageView data={result.data} />
    </AppServerLayout>
  );
}
