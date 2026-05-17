import Color from 'color';
import NextImage from 'next/image';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Flex, styled } from '@styled/jsx';
import type { ItemData } from '@types';
import { getLatestPricedItems } from '@pages/api/v1/prices/index';
import { LatestPricesItemsClient } from './LatestPricesItemsClient';

export type LatestPricesRes = {
  count: number | null;
  items: ItemData[];
};

const color = Color('#2e333b');
const rgb = color.rgb().array();
const borderColor = color.lightness(50).alpha(0.3).hexa();

async function getLatestPrices(): Promise<LatestPricesRes> {
  return getLatestPricedItems(16, true)
    .then((result) => result as LatestPricesRes)
    .catch(() => ({
      items: [],
      count: null,
    }));
}

export async function LatestPricesSection() {
  const t = await getTranslations();
  const formatter = await getFormatter();
  const latestPrices = await getLatestPrices();

  return (
    <Flex
      w="100%"
      flexFlow="column"
      p={2}
      bg="gray.700"
      borderRadius="md"
      style={{
        backgroundImage: `linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},0.45) 0%)`,
      }}
    >
      <Flex
        w="100%"
        px={2}
        py={4}
        flexFlow="column"
        borderRadius="lg"
        borderWidth="2px"
        borderStyle="solid"
        borderColor={borderColor}
      >
        <Flex alignItems="center" gap={4} flexShrink={0} h="70px" mb={3}>
          <NextImage
            src="https://images.neopets.com/quests/images/neopoint-bag.png"
            quality={100}
            width={70}
            height={70}
            alt={t('HomePage.latest-prices')}
            priority
          />
          <styled.h2 fontSize="3xl" fontWeight="bold" lineHeight="1.2">
            {t('HomePage.latest-prices')}
          </styled.h2>
        </Flex>

        <LatestPricesItemsClient items={latestPrices.items} />

        {latestPrices.count && (
          <styled.p textAlign="right" mt={4} fontSize="xs" color="whiteAlpha.400">
            {t('HomePage.x-prices-updated-last-y', {
              count: formatter.number(latestPrices.count),
              time: '48h',
            })}
          </styled.p>
        )}
      </Flex>
    </Flex>
  );
}
