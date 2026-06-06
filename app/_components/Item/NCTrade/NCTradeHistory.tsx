import { Button, Center, Flex, Link, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import { NCTradeHistoryCard } from '@app/_components/Item/NCTrade/NCTradeHistoryCard';
import { prepareNCTradeHistory } from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';
import type { ItemData, LebronTrade, NCTradeReport } from '@types';

type Props = {
  item: ItemData;
  ncTrades: LebronTrade[] | null;
  tradeHistory: NCTradeReport[] | null;
};

export async function NCTradeHistory({ item, ncTrades, tradeHistory }: Props) {
  const t = await getTranslations();
  const trades = prepareNCTradeHistory(ncTrades, tradeHistory);

  if (!trades.length) {
    return (
      <Center flexFlow="column" gap={2}>
        <Text fontSize="sm" opacity="0.75">
          {t('ItemPage.no-trade-history')}.
        </Text>
        <Button asChild size="xs">
          <I18nLink href="/mall/report" prefetch={false}>
            {t('ItemPage.report-your-nc-trades')}
          </I18nLink>
        </Button>
      </Center>
    );
  }

  return (
    <Flex flexFlow="column" maxH={300} overflow="auto" gap={3} w="100%">
      <Flex maxW="500px" flexFlow="column" gap={3}>
        {trades.map((trade, i) => (
          <NCTradeHistoryCard key={i} trade={trade} item={item} />
        ))}
        <Text fontSize="xs" textAlign="center" mt={2} color="whiteAlpha.600">
          {t.rich('ItemPage.owls-credits', {
            Link: (chunks) => (
              <Link asChild target="_blank" color="whiteAlpha.800">
                <I18nLink href="/articles/lebron" target="_blank">
                  {chunks}
                </I18nLink>
              </Link>
            ),
          })}
        </Text>
      </Flex>
    </Flex>
  );
}

export default NCTradeHistory;
