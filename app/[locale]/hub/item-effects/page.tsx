import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildItemEffectsPageProps } from './buildItemEffectsPageProps';
import { ItemEffectsPageClient } from './ItemEffectsPageClient';

const mainColor = 'rgba(248, 109, 186, 0.4)';

type ItemEffectsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ItemEffectsPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('ItemEffects.item-effect-hub'),
    description: t('ItemEffects.cta'),
    pathname: '/hub/item-effects',
  });

  return {
    ...pageProps.metadata,
  };
}

export default function ItemEffectsPage({ params }: ItemEffectsPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <ItemEffectsPageContent params={params} />
    </Suspense>
  );
}

async function ItemEffectsPageContent({ params }: ItemEffectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildItemEffectsPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <ItemEffectsPageClient labels={labels} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
