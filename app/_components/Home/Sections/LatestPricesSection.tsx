import { Suspense } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ItemV2For } from '@types';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { ItemService } from '@services/ItemService';
import { cacheLife, cacheTag } from 'next/cache';

export type LatestPricesRes = {
  count: number | null;
  items: ItemV2For<'card'>[];
};

type LatestPricesSectionProps = {
  title: string;
};

async function getLatestPrices(): Promise<LatestPricesRes> {
  'use cache';
  cacheTag('home-latest-prices');
  cacheLife('homeSection');
  try {
    const result = await ItemService.getLatestPriced(16, true);
    if (Array.isArray(result)) {
      return { items: result, count: null };
    }
    return result;
  } catch {
    return { items: [], count: null };
  }
}

function LatestPricesItemsGrid({ items }: { items: ItemV2For<'card'>[] }) {
  return (
    <Flex flexWrap="wrap" gap={4} justifyContent="center">
      {items.length > 0 &&
        items.map((item) => (
          <ItemCardV2
            uniqueID="latest-prices"
            item={item}
            key={item.internal_id}
            utm_content="latest-prices"
          />
        ))}
      {items.length === 0 &&
        [...Array(16)].map((_, index) => (
          <ItemCardV2 uniqueID="latest-prices" key={index} isLoading />
        ))}
    </Flex>
  );
}

export function LatestPricesSection({ title }: LatestPricesSectionProps) {
  return (
    <HorizontalHomeCard
      color="#2e333b"
      image="https://images.neopets.com/quests/images/neopoint-bag.png"
      title={title}
    >
      <Suspense fallback={<LatestPricesItemsGrid items={[]} />}>
        <LatestPricesSectionContent />
      </Suspense>
    </HorizontalHomeCard>
  );
}

async function LatestPricesSectionContent() {
  const [t, formatter, latestPrices] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getLatestPrices(),
  ]);

  return (
    <>
      <LatestPricesItemsGrid items={latestPrices.items} />
      {latestPrices.count && (
        <Text textAlign="right" mt={4} fontSize="xs" color="whiteAlpha.400">
          {t('HomePage.x-prices-updated-last-y', {
            count: formatter.number(latestPrices.count),
            time: '48h',
          })}
        </Text>
      )}
    </>
  );
}
