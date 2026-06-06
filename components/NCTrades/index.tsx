'use client';

import {
  Badge,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Icon,
  Link,
  Skeleton,
  Spinner,
  Stat,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { TbGiftOff } from 'react-icons/tb';
import { InsightsResponse, ItemData, LebronTrade, NCTradeReport, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import CardBase from '../Card/CardBase';
import MatchTable from './MatchTable';
import MainLink from '@components/Utils/MainLink';
import NCTradeHistory from './NCTradeHistory';
import { useTranslations } from 'next-intl';
import { TradeInsights } from './TradeInsights';

type Props = {
  item: ItemData;
  lists?: UserList[];
  insights: InsightsResponse | null;
};

type TableType = 'seeking' | 'trading' | 'insights' | 'ncTrading';

const NCTrade = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { item, lists, insights } = props;
  const color = item.color.rgb;
  const isNoTrade = item.status === 'no trade';

  const seeking = lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
  const trading = lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];

  const [match, setMatch] = useState({ seeking: {}, trading: {} });
  const [isMatchLoading, setIsMatchLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const hasInsights = useMemo(() => {
    if (!insights) return false;
    return insights.releases.length > 0 || insights.ncEvents.length > 0;
  }, [insights]);

  const [tableType, setTableType] = useState<TableType>(hasInsights ? 'insights' : 'seeking');
  const [lebronTradeHistory, setLebronTradeHistory] = useState<LebronTrade[] | null>(null);
  const [tradeHistory, setTradeHistory] = useState<NCTradeReport[] | null>(null);

  const tradeCount = useMemo(() => {
    if (!lebronTradeHistory && !tradeHistory) return '00';
    const lebronCount = lebronTradeHistory ? lebronTradeHistory.length : 0;
    const tradeCount = tradeHistory ? tradeHistory.length : 0;

    // temporarily limit the count to 20
    return Math.min(lebronCount + tradeCount, 20);
  }, [lebronTradeHistory, tradeHistory]);

  const init = async () => {
    if (!user || !user.username || (!seeking.length && !trading.length)) {
      setMatch({ seeking: {}, trading: {} });
      setIsMatchLoading(false);
      return;
    }

    setIsMatchLoading(true);
    const seekingUsers = seeking.map((list) => list.owner?.username);
    const tradingUsers = trading.map((list) => list.owner?.username);

    const [seekingRes, tradingRes] = await Promise.all([
      axios.post('/api/v1/lists/match/many', {
        target: user.username,
        users: seekingUsers,
        targetType: 'seeker',
      }),
      axios.post('/api/v1/lists/match/many', {
        target: user.username,
        users: tradingUsers,
        targetType: 'offerer',
      }),
    ]);

    setMatch({
      seeking: seekingRes.data,
      trading: tradingRes.data,
    });

    setIsMatchLoading(false);
  };

  const getTradeHistory = async () => {
    const [lebronRes, rawHistory] = await Promise.all([
      axios.get('/api/v1/items/' + encodeURIComponent(item.name) + '/lebron'),
      { data: { trades: [] } },
      // axios.get('/api/v1/items/' + encodeURIComponent(item.name) + '/nctrade'),
    ]);

    setLebronTradeHistory(lebronRes.data?.reports || []);
    setTradeHistory(rawHistory.data.trades);
    setIsHistoryLoading(false);
  };

  useEffect(() => {
    if (isNoTrade) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLebronTradeHistory(null);
    getTradeHistory();
  }, [item.internal_id]);

  useEffect(() => {
    if (authLoading || !user || isNoTrade || !lists) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [lists, user, authLoading]);

  if (isNoTrade && !hasInsights)
    return (
      <CardBase color={color} title={t('ItemPage.nc-trade')}>
        <Center>
          <Icon as={TbGiftOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
      </CardBase>
    );

  return (
    <CardBase title={t('ItemPage.nc-trade')} color={color}>
      <Flex flexFlow="column" minH={isNoTrade ? 'auto' : '200px'}>
        {!isNoTrade && (
          <Flex
            justifyContent={{ base: 'flex-start', md: 'center' }}
            gap={2}
            alignItems="center"
            pb={1.5}
            mb={1.5}
            overflow={'auto'}
          >
            <ButtonGroup size="sm" attached variant="outline">
              {hasInsights && (
                <Button
                  colorPalette={tableType === 'insights' ? 'blue' : ''}
                  borderColor={tableType === 'insights' ? undefined : 'whiteAlpha.800'}
                  data-active={tableType === 'insights' ? true : undefined}
                  onClick={() => setTableType('insights')}
                  data-umami-event="nc-trade-buttons"
                  data-umami-event-label={'insights'}
                >
                  {t('ItemPage.insights')}
                </Button>
              )}
              <Button
                colorPalette={tableType === 'seeking' ? 'cyan' : ''}
                borderColor={tableType === 'seeking' ? undefined : 'whiteAlpha.800'}
                data-active={tableType === 'seeking' ? true : undefined}
                onClick={() => setTableType('seeking')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label={'seeking'}
              >
                {seeking.length} {t('ItemPage.seeking')}
              </Button>
              <Button
                colorPalette={tableType === 'trading' ? 'purple' : ''}
                borderColor={tableType === 'trading' ? undefined : 'whiteAlpha.800'}
                data-active={tableType === 'trading' ? true : undefined}
                onClick={() => setTableType('trading')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label={'trading'}
              >
                {trading.length} {t('ItemPage.trading')}
              </Button>
              <Button
                colorPalette={tableType === 'ncTrading' ? 'yellow' : ''}
                borderColor={tableType === 'ncTrading' ? undefined : 'whiteAlpha.800'}
                data-active={tableType === 'ncTrading' ? true : undefined}
                onClick={() => setTableType('ncTrading')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label={'owls-trading'}
              >
                {(lebronTradeHistory ?? tradeHistory) !== null ? (
                  <span>{tradeCount}</span>
                ) : (
                  <Skeleton
                    as="span"
                    display="inline-block"
                    w="1.5em"
                    h="1em"
                    mr={1}
                    borderRadius="sm"
                  />
                )}{' '}
                {t('ItemPage.owls-trades')}
              </Button>
            </ButtonGroup>
          </Flex>
        )}
        <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
          {!isNoTrade && (
            <Badge
              colorPalette={item.ncValue && item.ncValue.source === 'lebron' ? 'yellow' : 'purple'}
              fontSize="xs"
              minW="15%"
              maxW={{ base: '100%', md: '25%' }}
              whiteSpace={'normal'}
              textTransform="initial"
              alignSelf={'center'}
              borderRadius={'md'}
              textAlign="center"
            >
              <Stat.Root flex="initial" justifyContent="center" alignItems="center" w="full">
                <Stat.Label fontSize="xs">
                  {!item.ncValue && t('ItemPage.nc-guide-value')}
                  {item.ncValue?.source === 'itemdb' && t('ItemPage.itemdb-value')}
                  {item.ncValue?.source === 'lebron' && (
                    <Link asChild target="_blank" rel="noreferrer">
                      <MainLink href="/articles/lebron" target="_blank">
                        {t('ItemPage.lebron-value')}
                      </MainLink>
                    </Link>
                  )}
                </Stat.Label>
                {!item.ncValue && (
                  <>
                    <Stat.ValueText mb={0}>???</Stat.ValueText>
                    <Text fontSize="xs" as="span">
                      {t('ItemPage.no-enough-data')}
                    </Text>
                    <Stat.HelpText fontSize="xs" mt={1} mb={0} fontWeight="medium" opacity={1}>
                      <Link asChild target="_blank" rel="noreferrer">
                        <MainLink href="/mall/report" target="_blank">
                          {t('ItemPage.report-your-nc-trades')}
                        </MainLink>
                      </Link>
                    </Stat.HelpText>
                  </>
                )}
                {item.ncValue && (
                  <>
                    <Stat.ValueText mb={0}>
                      {item.ncValue.range}
                      <Text fontSize="xs" as="span">
                        {' '}
                        caps
                      </Text>
                    </Stat.ValueText>

                    <Stat.HelpText fontSize="xs" mb={0} color="yellow.200">
                      {format(new Date(item.ncValue.addedAt), 'PP')}{' '}
                    </Stat.HelpText>
                  </>
                )}
              </Stat.Root>
            </Badge>
          )}
          {isNoTrade && (
            <Badge
              colorPalette="gray"
              fontSize="xs"
              minW="15%"
              maxW={{ base: '100%', md: '25%' }}
              whiteSpace={'normal'}
              textTransform="initial"
              alignSelf={'center'}
              borderRadius={'md'}
            >
              <Stat.Root
                flex="initial"
                justifyContent="center"
                alignItems="center"
                w="full"
                textAlign="center"
              >
                <Stat.Label>
                  <Icon mt={2} boxSize="24px" as={TbGiftOff} />
                </Stat.Label>
                <Stat.ValueText mb={1}>{t('ItemPage.no-trade')}</Stat.ValueText>
                <Stat.HelpText fontSize="xs" mt={0} fontWeight="medium">
                  {t('ItemPage.no-trade-help-text')}
                </Stat.HelpText>
              </Stat.Root>
            </Badge>
          )}
          <Flex flexFlow="column" flex="1" overflow="hidden">
            {tableType === 'insights' && insights && (
              <TradeInsights item={item} insights={insights} />
            )}
            {tableType !== 'insights' && (
              <Flex justifyContent="center" alignItems={'center'} gap={3}>
                {['seeking', 'trading'].includes(tableType) && (
                  <MatchTable
                    data={tableType === 'seeking' ? seeking : trading}
                    matches={tableType === 'seeking' ? match.seeking : match.trading}
                    type={tableType as 'seeking' | 'trading'}
                    isLoading={isMatchLoading}
                  />
                )}
                {tableType === 'ncTrading' && (
                  <>
                    {isHistoryLoading && <Spinner mt={8} />}
                    {!isHistoryLoading && (
                      <NCTradeHistory
                        item={item}
                        ncTrades={lebronTradeHistory}
                        tradeHistory={tradeHistory}
                      />
                    )}
                  </>
                )}
              </Flex>
            )}
          </Flex>
        </Flex>
        {!isNoTrade && (
          <Text
            fontSize="xs"
            textAlign="center"
            justifySelf={'flex-end'}
            color="whiteAlpha.600"
            mt={1}
          >
            {t.rich('ItemPage.report-owls-cta', {
              Link: (chunk) => (
                <Link asChild color="whiteAlpha.800">
                  <MainLink href="/mall/report?utm_content=owls-cta">{chunk}</MainLink>
                </Link>
              ),
            })}
          </Text>
        )}
      </Flex>
    </CardBase>
  );
};

export default NCTrade;
