import type { Metadata } from 'next';
// import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { ItemPage as ItemPageView } from '@app/_components/Item/page/ItemPage';
// import { ItemPageSkeleton } from '@app/_components/Item/page/ItemPageSkeleton';
import { preloadItemPageData } from '@app/_components/Item/preloadItemPage';
import { buildItemPageMetadata, resolveItemRoute } from '@app/utils/loadItemPage';
import { getItemDbCanonical, normalizeItemDbLocale } from '@app/utils/appPage';
import { buildItemDiscordEmbed } from '@app/_components/Item/seo/buildItemDiscordEmbed';
import { DiscordComponentEmbedScript } from '@app/utils/discordComponentEmbed';

export const instant = false;
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
  const result = await resolveItemRoute(slug);

  if (result.type === 'redirect') {
    permanentRedirect(getPathname({ locale, href: result.href }));
  }

  if (result.type === 'notFound') {
    notFound();
  }

  preloadItemPageData(result.item);

  const canonical = getItemDbCanonical(`/item/${result.item.slug}`, normalizeItemDbLocale(locale));
  const discordEmbed = await buildItemDiscordEmbed({ item: result.item, canonical });

  return (
    <div data-testid="item-page-content">
      <DiscordComponentEmbedScript payload={discordEmbed} />
      <SetMainColor color={result.item.color.hex + '66'} />
      <ItemPageView item={result.item} />
    </div>
  );
}
