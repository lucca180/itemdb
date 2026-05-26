import { Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { LatestPricesItemsClient } from '@components/Home/LatestPricesItemsClient';
import { getLatestPricedItems } from '@pages/api/v1/prices/index';
import { unstable_cache } from 'next/cache';

export type LatestPricesRes = {
  count: number | null;
  items: ItemData[];
};

const getLatestPrices = unstable_cache(
  async () => getLatestPricedItems(16, true).catch(() => ({ items: [], count: null })),
  ['home-server-cards', 'latest-prices'],
  {
    tags: ['home-latest-prices'],
    revalidate: 300,
  }
) as () => Promise<LatestPricesRes>;

export async function LatestPricesSection() {
  const t = await getTranslations();
  const formatter = await getFormatter();
  const latestPrices = await getLatestPrices();

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
