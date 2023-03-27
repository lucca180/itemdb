import {
  Button,
  ButtonGroup,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ItemData, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import CardBase from '../Card/CardBase';
import MatchTable from './MatchTable';

type Props = {
  item: ItemData;
  lists?: UserList[];
};

const ItemMatch = (props: Props) => {
  const { user } = useAuth();
  const { item, lists } = props;

  const seeking = lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
  const trading = lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];

  const [match, setMatch] = useState({ seeking: {}, trading: {} });
  const [tableType, setTableType] = useState<'seeking' | 'trading'>(
    seeking.length ? 'seeking' : 'trading'
  );

  useEffect(() => {
    if (!user) return;

    init();
  }, [lists, user]);

  const init = async () => {
    if (!user || !user.username) return;
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

  const color = item.color.rgb;
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
          </ButtonGroup>
          {/* <Badge colorScheme='cyan' fontSize="xs">{seeking.length} Seeking</Badge><br/>
          <Badge colorScheme='purple'>{trading.length} Trading</Badge> */}
        </Flex>
        <Flex alignItems={{ base: 'inherit', md: 'center' }}>
          {/* <Stat flex="initial" textAlign="center" minW="20%">
            <StatNumber>2~3</StatNumber>
            <StatHelpText>Cap Value</StatHelpText>
          </Stat> */}
          <Flex flexFlow="column" flex="1" overflow="hidden">
            <Flex justifyContent="center" alignItems={'center'} gap={3}>
              <MatchTable
                data={tableType === 'seeking' ? seeking : trading}
                matches={tableType === 'seeking' ? match.seeking : match.trading}
                type={tableType}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </CardBase>
  );
};

export default ItemMatch;
