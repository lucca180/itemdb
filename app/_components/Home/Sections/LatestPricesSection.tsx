// import { Suspense } from 'react';
import { Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ItemV2For } from '@types';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { LatestPricesItemsClient } from '@components/Home/LatestPricesItemsClient';
import { getLatestPricedItemsV2 } from '@app/api/v2/prices/latest';
import { cacheLife, cacheTag } from 'next/cache';

export type LatestPricesRes = {
  count: number | null;
  items: ItemV2For<'card'>[];
};

async function getLatestPrices(): Promise<LatestPricesRes> {
  'use cache';
  cacheTag('home-latest-prices');
  cacheLife('homeSection');
  try {
    const result = await getLatestPricedItemsV2(16, true);
    if (Array.isArray(result)) {
      return { items: result, count: null };
    }
    return result;
  } catch {
    return { items: [], count: null };
  }
}

export async function LatestPricesSection() {
  const [t, formatter, latestPrices] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getLatestPrices(),
  ]);

  return (
    <HorizontalHomeCard
      color="#2e333b"
      image="https://images.neopets.com/quests/images/neopoint-bag.png"
      title={t('HomePage.latest-prices')}
    >
      <LatestPricesItemsClient items={latestPrices.items} />

      {latestPrices.count && (
        <Text textAlign="right" mt={4} fontSize="xs" color="whiteAlpha.400">
          {t('HomePage.x-prices-updated-last-y', {
            count: formatter.number(latestPrices.count),
            time: '48h',
          })}
        </Text>
      )}
    </HorizontalHomeCard>
  );
}
