import {
  Badge,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Icon,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { MdMoneyOff } from 'react-icons/md';
import { ItemData, OwlsTrade, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import CardBase from '../Card/CardBase';
import MatchTable from './MatchTable';
import NextLink from 'next/link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import OwlsTradeHistory from './OwlsTradeHistory';
import Color from 'color';

type Props = {
  item: ItemData;
  lists?: UserList[];
};

const NCTrade = (props: Props) => {
  const { user } = useAuth();
  const { item, lists } = props;
  const color = item.color.rgb;
  const textColor = Color.rgb(color).lighten(0.3).hex();

  const seeking = lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
  const trading = lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];

  const [match, setMatch] = useState({ seeking: {}, trading: {} });
  const [tableType, setTableType] = useState<'seeking' | 'trading' | 'owlsTrading'>(
    seeking.length ? 'seeking' : 'trading'
  );
  const [tradeHistory, setTradeHistory] = useState<OwlsTrade[] | null>(null);

  useEffect(() => {
    if (item.status === 'no trade') return;
    getOwlsTrade();
  }, []);

  useEffect(() => {
    if (!user || item.status === 'no trade') return;

    init();
  }, [lists, user]);

  const init = async () => {
    if (!user || !user.username || (!seeking.length && !trading.length)) return;
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
  };

  const getOwlsTrade = async () => {
    const res = await axios.get('/api/v1/items/' + encodeURIComponent(item.name) + '/owls');

    setTradeHistory(res.data);
  };

  if (item.status === 'no trade')
    return (
      <CardBase color={color} title="NC Trade">
        <Center>
          <Icon as={MdMoneyOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">This item is not tradeable.</Text>
      </CardBase>
    );

  return (
    <CardBase title="NC Trade" color={color}>
      <Flex flexFlow="column" minH="200px">
        <Flex justifyContent="center" gap={2} alignItems="center" mb={3}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              colorScheme={tableType === 'seeking' ? 'cyan' : ''}
              isActive={tableType === 'seeking'}
              onClick={() => setTableType('seeking')}
            >
              {seeking.length} Seeking
            </Button>
            <Button
              colorScheme={tableType === 'trading' ? 'purple' : ''}
              isActive={tableType === 'trading'}
              onClick={() => setTableType('trading')}
            >
              {trading.length} Trading
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
              {tradeHistory?.length} Owls Trades
            </Button>
          </ButtonGroup>
        </Flex>
        <Flex
          alignItems={{ base: 'inherit', md: 'center' }}
          flexFlow={{ base: 'column', md: 'row' }}
          gap={3}
        >
          {item.owls && (
            <Badge colorScheme="purple" fontSize="xs" minW="15%" textTransform="initial">
              <Stat flex="initial" textAlign="center">
                <StatNumber>{item.owls.buyable ? 'Buyable' : item.owls.value}</StatNumber>
                <StatHelpText mb={0} as={NextLink} href="/articles/owls">
                  Owls Value <ExternalLinkIcon boxSize={3} verticalAlign="center" />
                </StatHelpText>
                <StatLabel fontSize="xs">
                  on {format(new Date(item.owls.pricedAt), 'PP')}{' '}
                </StatLabel>
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
                />
              )}
              {tableType === 'owlsTrading' && (
                <OwlsTradeHistory item={item} tradeHistory={tradeHistory} />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </CardBase>
  );
};

export default NCTrade;
