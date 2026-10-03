import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import RestockHeader from '@components/Hubs/Restock/RestockHeader';
import { PracticeFaq } from '@components/Hubs/Restock/Practice/PracticeFaq';
import { PracticePopularShops } from '@components/Hubs/Restock/Practice/PracticePopularShops';
import { RestockLinkPills } from '@components/Hubs/Restock/RestockLinkPills';
import { getStaticAppMetadata } from '@app/utils/appPage';
import {
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';

import {
  buildRestockPracticePageMetadata,
  buildRestockPracticePageProps,
  getRestockPracticePathname,
} from './buildRestockPracticePageProps';
import { getPopularPracticeShops } from './loadPopularPracticeShops';
import { RestockPracticePageClient } from './RestockPracticePageClient';

type RestockPracticePageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockPracticePageProps): Promise<Metadata> {
  const { id } = await params;
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const { title, description } = await buildRestockPracticePageMetadata(shopInfo);
  const metadata = await getStaticAppMetadata({
    title,
    description,
    pathname: getRestockPracticePathname(shopInfo),
  });

  return {
    ...metadata,
    title: { absolute: title },
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
      images: [
        {
          url: `https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`,
          width: 450,
          height: 150,
          alt: shopInfo.name,
        },
      ],
    },
  };
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

  const [labels, popularShops] = await Promise.all([
    buildRestockPracticePageProps(route.shop),
    getPopularPracticeShops(route.shop.id),
  ]);

  return (
    <>
      <SetMainColor color={`${route.shop.color}a6`} />
      <RestockHeader
        shop={route.shop}
        subpageBadge={labels.badge}
        breadcrumbList={labels.breadcrumbList}
        locale={locale}
        useAppDir
        specialDayLabels={labels.specialDayLabels}
      >
        <Text as="h2" textAlign="center" maxW="3xl">
          {labels.intro}
        </Text>
        <RestockLinkPills pills={labels.pills} trackEvent="restock-practice-pills" />
      </RestockHeader>
      <RestockPracticePageClient shopInfo={route.shop} />
      <PracticePopularShops title={labels.popularShopsTitle} shops={popularShops} />
      <PracticeFaq title={labels.faqTitle} items={labels.faqItems} />
    </>
  );
}
