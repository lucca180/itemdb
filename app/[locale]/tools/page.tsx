import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { ToolsPageClient } from './ToolsPageClient';
import { TOOLS_ACCENT } from './toolsData';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Tools');
  const title = t('seo-title');
  const metadata = await getStaticAppMetadata({
    title,
    description: t('seo-description'),
    pathname: '/tools',
  });

  return {
    ...metadata,
    title: { absolute: title },
  };
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={`${TOOLS_ACCENT}c7`} />
      <ToolsPageClient />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
