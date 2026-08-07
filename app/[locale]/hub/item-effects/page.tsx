import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildItemEffectsPageProps } from './buildItemEffectsPageProps';
import { ItemEffectsPageClient } from './ItemEffectsPageClient';

const mainColor = 'rgba(248, 109, 186, 0.4)';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('ItemEffects.item-effect-hub'),
    description: t('ItemEffects.cta'),
    pathname: '/hub/item-effects',
  });

  return {
    ...metadata,
  };
}

export default function ItemEffectsPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ItemEffectsPageContent />
    </Suspense>
  );
}

async function ItemEffectsPageContent() {
  const labels = await buildItemEffectsPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
      <ItemEffectsPageClient labels={labels} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
