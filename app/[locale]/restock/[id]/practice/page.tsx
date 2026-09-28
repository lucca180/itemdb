import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import {
  RestockBreadcrumb,
  createRestockBreadcrumbList,
} from '@components/Breadcrumbs/RestockBreadcrumb';
import { getStaticAppMetadata } from '@app/utils/appPage';
import {
  getRestockShopPathname,
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';

import { RestockPracticePageClient } from './RestockPracticePageClient';

type RestockPracticePageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockPracticePageProps): Promise<Metadata> {
  const { id } = await params;
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const t = await getTranslations();

  return getStaticAppMetadata({
    title: `${shopInfo.name} | ${t('Restock.practice-mode')}`,
    description: t('Restock.practice-description'),
    pathname: `${getRestockShopPathname(shopInfo)}/practice`,
  });
}

export default function RestockPracticePage({ params }: RestockPracticePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <RestockPracticePageContent params={params} />
    </Suspense>
  );
}

async function RestockPracticePageContent({ params }: RestockPracticePageProps) {
  const { locale, id } = await params;
  const route = resolveRestockShopRoute(id, locale, { practice: true });

  if (route.type === 'redirect') {
    permanentRedirect(route.destination);
  }
  if (route.type === 'notFound') {
    notFound();
  }

  const t = await getTranslations();
  const breadcrumbList = createRestockBreadcrumbList(route.shop, t);
  breadcrumbList.push({
    position: breadcrumbList.length + 1,
    name: t('Restock.practice-mode'),
    item: `${getRestockShopPathname(route.shop)}/practice`,
  });

  return (
    <>
      <SetMainColor color={`${route.shop.color}a6`} />
      <Box mt={2} mb={4}>
        <RestockBreadcrumb breadcrumbList={breadcrumbList} locale={locale} useAppDir />
      </Box>
      <RestockPracticePageClient shopInfo={route.shop} />
    </>
  );
}
