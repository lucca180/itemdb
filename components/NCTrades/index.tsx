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
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { MdMoneyOff } from 'react-icons/md';
import { ItemData, NCTradeReport, OwlsTrade, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import CardBase from '../Card/CardBase';
import MatchTable from './MatchTable';
import NextLink from 'next/link';
import OwlsTradeHistory from './OwlsTradeHistory';
import Color from 'color';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  lists?: UserList[];
};

const NCTrade = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { item, lists } = props;
  const color = item.color.rgb;
  const textColor = Color.rgb(color).lighten(0.65).hex();

  const seeking = lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
  const trading = lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];

  const [match, setMatch] = useState({ seeking: {}, trading: {} });
  const [isMatchLoading, setIsMatchLoading] = useState(true);
  const [tableType, setTableType] = useState<'seeking' | 'trading' | 'owlsTrading'>(
    seeking.length ? 'seeking' : 'trading'
  );
  const [owlsTradeHistory, setOwlsTradeHistory] = useState<OwlsTrade[] | null>(null);
  const [tradeHistory, setTradeHistory] = useState<NCTradeReport[] | null>(null);

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
        <Flex justifyContent="center" gap={2} alignItems="center" mb={3}>
          <ButtonGroup size="sm" isAttached variant="outline">
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
              colorScheme={''}
              _active={{
                bg: `rgba(${color[0]},${color[1]}, ${color[2]},.24)`,
                borderColor: `rgba(${color[0]},${color[1]}, ${color[2]},1)`,
                color: textColor,
              }}
              isActive={tableType === 'owlsTrading'}
              onClick={() => setTableType('owlsTrading')}
            >
              <Skeleton isLoaded={owlsTradeHistory !== null} startColor={item.color.hex} mr={1}>
                <span>{owlsTradeHistory?.length ?? '00'}</span>
              </Skeleton>{' '}
              {t('ItemPage.owls-trades')}
            </Button>
          </ButtonGroup>
        </Flex>
        <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
          {item.ncValue && (
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
                <StatLabel fontSize="xs">Est. Value</StatLabel>
                <StatNumber mb={0}>
                  {item.ncValue.range}
                  <Text fontSize="xs" as="span">
                    {' '}
                    caps
                  </Text>
                </StatNumber>
                <StatLabel fontSize="xs">{format(new Date(item.ncValue.addedAt), 'PP')} </StatLabel>
              </Stat>
            </Badge>
          )}
          <Flex flexFlow="column" flex="1" overflow="hidden">
            <Flex justifyContent="center" alignItems={'center'} gap={3}>
              {tableType !== 'owlsTrading' && (
                <MatchTable
                  data={tableType === 'seeking' ? seeking : trading}
                  matches={tableType === 'seeking' ? match.seeking : match.trading}
                  type={tableType}
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
