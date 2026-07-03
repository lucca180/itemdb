import { Badge, Flex, HStack, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import { IntervalFormatted } from '@components/Utils/IntervalFormatted';
import type { RestockStats } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import { getShopRankingMetric } from '@utils/restock';
import { restockShopInfo } from '@utils/utils';

type ShopRankingTabProps = {
  shopRanking: RestockStats['shopRanking'];
};

export function ShopRankingTab({ shopRanking }: ShopRankingTabProps) {
  const formatter = useFormatter();
  const t = useTranslations();

  return (
    <Flex gap={3} flexFlow="column">
      {shopRanking.map((ranking, i) => {
        const shopInfo = restockShopInfo[ranking.shopId];
        const shopName = shopInfo?.name ?? t('Restock.unknown-shop');
        const { amount, isProfit } = getShopRankingMetric(ranking);
        const amountColor = isProfit ? (amount >= 0 ? 'green.100' : 'red.200') : 'whiteAlpha.700';

        return (
          <Flex
            key={ranking.shopId}
            bg="blackAlpha.500"
            borderRadius="md"
            p={3}
            gap={3}
            alignItems={{ base: 'flex-start', sm: 'center' }}
            flexFlow={{ base: 'column', sm: 'row' }}
            textAlign="left"
          >
            <Flex
              boxSize="32px"
              borderRadius="full"
              bg="blackAlpha.500"
              color="green.100"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              flexShrink={0}
            >
              {i + 1}
            </Flex>
            <Flex flexFlow="column" gap={1} flex={1} minW={0}>
              <Link asChild color="green.100" fontWeight="semibold">
                <MainLink href={`/restock/${ranking.shopId}`}>{shopName}</MainLink>
              </Link>
              <HStack gap={2} flexWrap="wrap" fontSize="xs" color="whiteAlpha.700">
                <Text>
                  {t('Restock.x-items-bought', {
                    0: formatter.number(ranking.totalBought.count),
                  })}
                </Text>
                <Text>
                  {t('Restock.x-clicks', {
                    x: formatter.number(ranking.totalClicks),
                  })}
                </Text>
                <Text textTransform="capitalize">
                  <IntervalFormatted ms={ranking.durationCount} long />
                </Text>
              </HStack>
            </Flex>
            <Flex
              flexFlow="column"
              alignItems={{ base: 'flex-start', sm: 'flex-end' }}
              gap={1}
              flexShrink={0}
            >
              <Text color={amountColor} fontWeight="semibold">
                {formatter.number(amount)} NP
              </Text>
              {!isProfit && (
                <Text fontSize="xs" color="whiteAlpha.600">
                  {t('Restock.est-revenue')}
                </Text>
              )}
              <HStack gap={2} flexWrap="wrap" justifyContent="flex-end">
                <Badge colorPalette="green">
                  {t('Restock.success-rate-value', {
                    x: ranking.successRate.toFixed(1),
                  })}
                </Badge>
                <Badge colorPalette="red">
                  {t('Restock.x-lost', {
                    x: formatter.number(ranking.totalLost.count),
                  })}
                </Badge>
              </HStack>
            </Flex>
          </Flex>
        );
      })}
      {shopRanking.length === 0 && (
        <Text fontSize="xs" color="gray.400">
          {t('Restock.no-shop-ranking')}
        </Text>
      )}
    </Flex>
  );
}
