import {
  Badge,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Icon,
  Link,
  Skeleton,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { MdMoneyOff } from 'react-icons/md';
import { InsightsResponse, ItemData, NCTradeReport, OwlsTrade, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import CardBase from '../Card/CardBase';
import MatchTable from './MatchTable';
import NextLink from 'next/link';
import OwlsTradeHistory from './OwlsTradeHistory';
import { useTranslations } from 'next-intl';
import { TradeInsights } from './TradeInsights';

type Props = {
  item: ItemData;
  lists?: UserList[];
  insights: InsightsResponse | null;
};

const NCTrade = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { item, lists, insights } = props;
  const color = item.color.rgb;

  const seeking = lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
  const trading = lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];

  const [match, setMatch] = useState({ seeking: {}, trading: {} });
  const [isMatchLoading, setIsMatchLoading] = useState(true);

  const hasInsights = useMemo(() => {
    if (!insights) return false;
    return insights.releases.length > 0 || insights.ncEvents.length > 0;
  }, [insights]);

  const [tableType, setTableType] = useState<'seeking' | 'trading' | 'insights' | 'owlsTrading'>(
    hasInsights ? 'insights' : 'seeking'
  );
  const [owlsTradeHistory, setOwlsTradeHistory] = useState<OwlsTrade[] | null>(null);
  const [tradeHistory, setTradeHistory] = useState<NCTradeReport[] | null>(null);

  const tradeCount = useMemo(() => {
    if (!owlsTradeHistory && !tradeHistory) return '00';
    const owlsCount = owlsTradeHistory ? owlsTradeHistory.length : 0;
    const tradeCount = tradeHistory ? tradeHistory.length : 0;

    // temporarily limit the count to 20
    return Math.min(owlsCount + tradeCount, 20);
  }, [owlsTradeHistory, tradeHistory]);

  useEffect(() => {
    if (item.status === 'no trade') return;
    setOwlsTradeHistory(null);
    getTradeHistory();
  }, [item.internal_id]);

  useEffect(() => {
    if (authLoading || !user || item.status === 'no trade' || !lists) return;
    init();
  }, [lists, user, authLoading]);

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
    const [owlsRes, rawHistory] = await Promise.all([
      axios.get('/api/v1/items/' + encodeURIComponent(item.name) + '/owls'),
      axios.get('/api/v1/items/' + encodeURIComponent(item.name) + '/nctrade'),
    ]);

    setOwlsTradeHistory(owlsRes.data);
    setTradeHistory(rawHistory.data.trades);
  };

  if (item.status === 'no trade')
    return (
      <CardBase color={color} title={t('ItemPage.nc-trade')}>
        <Center>
          <Icon as={MdMoneyOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
      </CardBase>
    );

  return (
    <CardBase title={t('ItemPage.nc-trade')} color={color}>
      <Flex flexFlow="column" minH="200px">
        <Flex
          justifyContent={{ base: 'flex-start', md: 'center' }}
          gap={2}
          alignItems="center"
          pb={1.5}
          mb={1.5}
          overflow={'auto'}
        >
          <ButtonGroup size="sm" isAttached variant="outline">
            {hasInsights && (
              <Button
                colorScheme={tableType === 'insights' ? 'blue' : ''}
                isActive={tableType === 'insights'}
                onClick={() => setTableType('insights')}
              >
                {t('ItemPage.insights')}
              </Button>
            )}
            <Button
              colorScheme={tableType === 'seeking' ? 'cyan' : ''}
              isActive={tableType === 'seeking'}
              onClick={() => setTableType('seeking')}
            >
              {seeking.length} {t('ItemPage.seeking')}
            </Button>
            <Button
              colorScheme={tableType === 'trading' ? 'purple' : ''}
              isActive={tableType === 'trading'}
              onClick={() => setTableType('trading')}
            >
              {trading.length} {t('ItemPage.trading')}
            </Button>
            <Button
              colorScheme={tableType === 'owlsTrading' ? 'teal' : ''}
              isActive={tableType === 'owlsTrading'}
              onClick={() => setTableType('owlsTrading')}
            >
              <Skeleton isLoaded={owlsTradeHistory !== null} startColor={item.color.hex} mr={1}>
                <span>{tradeCount}</span>
              </Skeleton>{' '}
              {t('ItemPage.owls-trades')}
            </Button>
          </ButtonGroup>
        </Flex>
        <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
          <Badge
            colorScheme="purple"
            fontSize="xs"
            minW="15%"
            maxW={{ base: '100%', md: '25%' }}
            whiteSpace={'normal'}
            textTransform="initial"
            alignSelf={'center'}
            borderRadius={'md'}
          >
            <Stat flex="initial" textAlign="center">
              <StatLabel fontSize="xs">{t('ItemPage.nc-guide-value')}</StatLabel>
              {!item.ncValue && (
                <>
                  <StatNumber mb={0}>???</StatNumber>
                  <Text fontSize="xs" as="span">
                    {t('ItemPage.no-enough-data')}
                  </Text>
                  <StatHelpText fontSize="xs" mt={1} mb={0} fontWeight={'medium'} opacity={1}>
                    <Link as={Link} href="/mall/report" isExternal>
                      {t('ItemPage.report-your-nc-trades')}
                    </Link>
                  </StatHelpText>
                </>
              )}
              {item.ncValue && (
                <>
                  <StatNumber mb={0}>
                    {item.ncValue.range}
                    <Text fontSize="xs" as="span">
                      {' '}
                      caps
                    </Text>
                  </StatNumber>

                  <StatHelpText fontSize="xs" mb={0}>
                    {format(new Date(item.ncValue.addedAt), 'PP')}{' '}
                  </StatHelpText>
                </>
              )}
            </Stat>
          </Badge>

          <Flex flexFlow="column" flex="1" overflow="hidden">
            {tableType === 'insights' && insights && (
              <TradeInsights item={item} insights={insights} />
            )}
            <Flex justifyContent="center" alignItems={'center'} gap={3}>
              {['seeking', 'trading'].includes(tableType) && (
                <MatchTable
                  data={tableType === 'seeking' ? seeking : trading}
                  matches={tableType === 'seeking' ? match.seeking : match.trading}
                  type={tableType as 'seeking' | 'trading'}
                  isLoading={isMatchLoading}
                />
              )}
              {tableType === 'owlsTrading' && (
                <OwlsTradeHistory
                  item={item}
                  owlsTrades={owlsTradeHistory}
                  tradeHistory={tradeHistory}
                />
              )}
            </Flex>
          </Flex>
        </Flex>

        <Text
          fontSize="xs"
          textAlign="center"
          justifySelf={'flex-end'}
          color="whiteAlpha.600"
          mt={1}
        >
          {t.rich('ItemPage.report-owls-cta', {
            Link: (chunk) => (
              <Link
                as={NextLink}
                href="/mall/report?utm_content=owls-cta"
                color="whiteAlpha.800"
                isExternal
              >
                {chunk}
              </Link>
            ),
          })}
        </Text>
      </Flex>
    </CardBase>
  );
};

export default NCTrade;
