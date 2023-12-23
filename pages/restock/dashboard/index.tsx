import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  Text,
  Link,
  SimpleGrid,
  Select,
  UnorderedList,
  ListItem,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  Button,
  Icon,
  useDisclosure,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  CloseButton,
} from '@chakra-ui/react';
import Color from 'color';
import { ReactElement, useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import NextLink from 'next/link';
import { StatsCard } from '../../../components/Hubs/Restock/StatsCard';
import ItemCard from '../../../components/Items/ItemCard';
import ImportRestockModal from '../../../components/Modal/ImportRestock';
import { ItemData, RestockSession, RestockStats } from '../../../types';
import { useAuth } from '../../../utils/auth';
import axios from 'axios';
import { RestockSession as RawRestockSession } from '@prisma/client';
import { differenceInMilliseconds } from 'date-fns';
import { msIntervalFormated, removeOutliers, restockShopInfo } from '../../../utils/utils';
import RestockItem from '../../../components/Hubs/Restock/RestockItemCard';
import { FiSend } from 'react-icons/fi';
import FeedbackModal from '../../../components/Modal/FeedbackModal';

const color = Color('#599379').rgb().array();

type AlertMsg = {
  title?: ReactElement | string;
  description?: ReactElement | string;
  type: 'loading' | 'info' | 'warning' | 'success' | 'error' | undefined;
};

type ValueOf<T> = T[keyof T];
type PeriodFilter = { timePeriod: number; shops: number | string };
const intl = new Intl.NumberFormat();

const RestockDashboard = () => {
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openImport, setOpenImport] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<RestockStats | null>(null);
  const [alertMsg, setAlertMsg] = useState<AlertMsg | null>(null);
  const [importCount, setImportCount] = useState<number>(0);
  const [shopList, setShopList] = useState<number[]>([]);
  const [noScript, setNoScript] = useState<boolean>(false);
  const [filter, setFilter] = useState<PeriodFilter>({
    timePeriod: 30,
    shops: 'all',
  });

  useEffect(() => {
    if (!authLoading && user) {
      handleImport();
      init();
    }
  }, [user, authLoading]);

  const init = async (customFilter?: PeriodFilter) => {
    customFilter = customFilter ?? filter;
    setAlertMsg({ type: 'loading', title: 'Loading your restock sessions...' });
    try {
      const res = await axios.get('/api/v1/restock', {
        params: {
          startDate: Date.now() - customFilter.timePeriod * 24 * 60 * 60 * 1000,
          shopId: customFilter.shops === 'all' ? undefined : customFilter.shops,
        },
      });
      const sessionsData = res.data.sessions as RawRestockSession[];

      if (!sessionsData.length) {
        setAlertMsg({
          type: 'warning',
          description: (
            <>
              You have no restock sessions for the selected period
              <br />
              Try another period or import your sessions
            </>
          ),
        });
        return;
      }
      const stats = await calculateStats(sessionsData, customFilter);
      setSessionStats(stats);
      setAlertMsg(null);
    } catch (err) {
      console.error(err);
      setAlertMsg({
        type: 'error',
        description: (
          <>
            Something went wrong while loading your restock sessions
            <br />
            Try again later.
          </>
        ),
      });
    }
  };

  const handleImport = () => {
    if (!window) return;
    let currentParsed: RestockSession[] = [];
    let unsyncParsed: RestockSession[] = [];

    if (window.itemdb_restock) {
      const { current_sessions, unsync_sessions } = window.itemdb_restock.getSessions();
      currentParsed = Object.values(current_sessions);
      unsyncParsed = unsync_sessions;
    } else {
      console.log('itemdb_restock not found');
      setNoScript(true);
    }

    const validSessions = [...currentParsed, ...unsyncParsed].filter(
      (x) => x.clicks.length && Object.keys(x.items).length
    );

    setImportCount(validSessions.length);
  };

  const handleClose = () => {
    handleImport();
    setOpenImport(false);
  };

  const refresh = async () => {
    handleClose();
    init();
  };

  const calculateStats = async (rawSessions: RawRestockSession[], customFilter: PeriodFilter) => {
    const stats = JSON.parse(JSON.stringify(defaultStats));
    const sessions: RestockSession[] = [];
    const allShops: { [id: string]: number } = {};
    const allBought: RestockStats['hottestBought'] = [];
    const allLost: RestockStats['hottestBought'] = [];
    const allItems: ValueOf<RestockSession['items']>[] = [];

    let refreshTotalTime: number[] = [];
    let reactionTotalTime: number[] = [];

    rawSessions.map((rawSession) => {
      if (!rawSession.session) return;
      const session = JSON.parse(rawSession.session as string) as RestockSession;
      sessions.push(session);

      const duration = differenceInMilliseconds(
        new Date(rawSession.endedAt),
        new Date(rawSession.startedAt)
      );
      stats.durationCount += duration;
      allShops[rawSession.shop_id] = allShops[rawSession.shop_id]
        ? allShops[rawSession.shop_id] + duration
        : duration;
      stats.totalRefreshes += session.refreshes.length;
      stats.totalSessions++;

      session.refreshes.map((x, i) => {
        if (i === 0) return;
        refreshTotalTime.push(
          differenceInMilliseconds(new Date(x), new Date(session.refreshes[i - 1]))
        );
      });

      session.clicks.map((click) => {
        const item = session.items[click.restock_id];
        const time = click.haggle_timestamp || click.soldOut_timestamp;
        if (!item || !time) return;

        reactionTotalTime.push(
          Math.abs(differenceInMilliseconds(new Date(time), new Date(item.timestamp)))
        );
      });

      allItems.push(...Object.values(session.items));

      stats.totalRefreshes += session.refreshes.length;
    });

    const morePopularShop = Object.keys(allShops).reduce((a, b) =>
      allShops[a] > allShops[b] ? a : b
    );
    stats.mostPopularShop = {
      shopId: parseInt(morePopularShop),
      durationCount: allShops[morePopularShop] ?? 0,
    };

    // remove outliers
    refreshTotalTime = removeOutliers(refreshTotalTime, 1);
    stats.avgRefreshTime = refreshTotalTime.reduce((a, b) => a + b, 0) / refreshTotalTime.length;

    reactionTotalTime = removeOutliers(reactionTotalTime, 1);
    stats.avgReactionTime = reactionTotalTime.reduce((a, b) => a + b, 0) / reactionTotalTime.length;

    const allItemsID = new Set(allItems.map((x) => x.item_id.toString()));

    const itemRes = await axios.post('/api/v1/items/many', {
      item_id: [...allItemsID],
    });

    const allItemsData = itemRes.data as { [id: string]: ItemData };

    sessions.map((session) => {
      console.log(session);
      session.clicks.map((click) => {
        const item = allItemsData[click.item_id];
        const restockItem = session.items[click.restock_id];
        if (!item) return;

        if (!item.price.value) stats.unknownPrices++;

        if (click.buy_timestamp) {
          stats.totalBought.count++;
          stats.totalBought.value += item.price.value ?? 0;

          stats.mostExpensiveBought =
            stats.mostExpensiveBought &&
            (stats.mostExpensiveBought.price.value ?? 0) > (item.price.value ?? 0)
              ? stats.mostExpensiveBought
              : item;

          allBought.push({ item, click, restockItem });

          stats.estRevenue += item.price.value ?? 0;
        } else {
          stats.totalLost.count++;
          stats.totalLost.value += item.price.value ?? 0;

          stats.mostExpensiveLost =
            stats.mostExpensiveLost &&
            (stats.mostExpensiveLost.price.value ?? 0) > (item.price.value ?? 0)
              ? stats.mostExpensiveLost
              : item;

          allLost.push({ item, click, restockItem });
        }
      });
    });

    stats.hottestRestocks = Object.values(allItemsData)
      .sort((a, b) => (b.price.value ?? 0) - (a.price.value ?? 0))
      .splice(0, 16);

    stats.hottestBought = allBought
      .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
      .splice(0, 10);

    stats.hottestLost = allLost
      .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
      .splice(0, 10);

    if (customFilter.shops === 'all') setShopList(Object.keys(allShops).map((x) => parseInt(x)));

    return stats;
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    init({ ...filter, [name]: value });
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Layout
      SEO={{
        title: `Neopets Restock Dashboard`,
        description: `Keep track on your restock metrics, profit, response time, check out the items you missed haggling and more!`,
        themeColor: '#599379',
      }}
    >
      <ImportRestockModal isOpen={openImport} onClose={handleClose} refresh={refresh} />
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Text fontSize="xs" mt={2}>
        <Link as={NextLink} href="/restock">
          ← Back to Restock Hub
        </Link>
      </Text>
      <Flex gap={2} alignItems="center" justifyContent={['center', 'center', 'flex-start']} my={2}>
        <Select
          maxW="150px"
          variant={'filled'}
          bg="blackAlpha.300"
          size="xs"
          borderRadius={'sm'}
          defaultValue={30}
          name="timePeriod"
          value={filter.timePeriod}
          onChange={handleSelectChange}
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          {/* <option>All Time</option> */}
        </Select>
        <Select
          maxW="150px"
          variant={'filled'}
          bg="blackAlpha.300"
          size="xs"
          borderRadius={'sm'}
          name="shops"
          value={filter.shops}
          onChange={handleSelectChange}
        >
          <option value="all">All Shops</option>
          {shopList.map((shopId) => (
            <option key={shopId} value={shopId}>
              {restockShopInfo[shopId].name}
            </option>
          ))}
        </Select>
        {!!importCount && (
          <Button
            size="xs"
            // bg="blackAlpha.300"
            colorScheme="green"
            boxShadow={'md'}
            borderRadius={'sm'}
            onClick={() => setOpenImport(true)}
          >
            Import {importCount} sessions
          </Button>
        )}
      </Flex>
      {noScript && (
        <Center flexFlow={'column'} my={3}>
          <Alert status={'warning'} maxW="500px" variant="subtle" borderRadius={'md'}>
            <AlertIcon />
            <Box w="100%">
              <AlertDescription fontSize="sm">
                We detected that you don&apos;t have the most updated version of the{' '}
                <Link
                  href="https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js"
                  color="yellow.100"
                  isExternal
                >
                  Restock Tracker Script
                </Link>
                .
              </AlertDescription>
            </Box>
            <CloseButton
              alignSelf="flex-start"
              position="relative"
              right={0}
              top={-1}
              onClick={() => setNoScript(false)}
            />
          </Alert>
        </Center>
      )}
      {!sessionStats && (
        <>
          <Center flexFlow={'column'} gap={2}>
            <Heading size="lg">itemdb&apos;s Restock Dashboard</Heading>
            <Text>
              Keep track on your restock metrics, profit, response time, and check out the items you
              missed haggling
            </Text>
          </Center>
          <Divider my={6} />

          {alertMsg && (
            <Center flexFlow={'column'} my={3}>
              <Alert status={alertMsg.type} maxW="500px" variant="subtle" borderRadius={'md'}>
                <AlertIcon />
                <Box>
                  {alertMsg.title && <AlertTitle>{alertMsg.title}</AlertTitle>}
                  {alertMsg.description && (
                    <AlertDescription fontSize="sm">{alertMsg.description}</AlertDescription>
                  )}
                </Box>
              </Alert>
            </Center>
          )}

          <Heading size="md">How to Use</Heading>
          <UnorderedList mt={3} pl={3} sx={{ a: { color: 'green.200' } }} spacing={2}>
            {!user && (
              <ListItem>
                <Text>
                  You will need a{' '}
                  <Link as={NextLink} href="/login">
                    itemdb account
                  </Link>{' '}
                  to sync your restock data with our servers
                </Text>
              </ListItem>
            )}
            <ListItem>
              Install{' '}
              <Link href="https://www.tampermonkey.net/" isExternal>
                Tampermonkey
              </Link>{' '}
              extension for your browser if you don&apos;t have it already.
            </ListItem>
            <ListItem>
              <Text>
                Install{' '}
                <Link
                  href="https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js"
                  isExternal
                >
                  itemdb Restock Tracker Script
                </Link>{' '}
              </Text>
              <Text fontSize="sm" color="gray.400">
                The script will automatically track your restock sessions and save them in your
                device.
                <br />
                No data will be sent to our servers without your input.
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                Install{' '}
                <Link
                  href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
                  isExternal
                >
                  itemdb Item Data Extractor Script
                </Link>{' '}
              </Text>
              <Text fontSize="sm" color="gray.400">
                Optional but will greatly help us to improve our data.{' '}
                <Link href="/contribute" isExternal>
                  Learn More
                </Link>
              </Text>
            </ListItem>
            <ListItem>
              <Text>Go restock! </Text>
              <Text fontSize="sm" color="gray.400">
                We have a{' '}
                <Link as={NextLink} href="/restock">
                  handful guide
                </Link>{' '}
                to help you find the most profitable items from each neopian shop
              </Text>
            </ListItem>
          </UnorderedList>
        </>
      )}

      {!!sessionStats && (
        <>
          {alertMsg && (
            <Center flexFlow={'column'} my={3}>
              <Alert status={alertMsg.type} maxW="500px" variant="subtle" borderRadius={'md'}>
                <AlertIcon />
                <Box>
                  {alertMsg.title && <AlertTitle>{alertMsg.title}</AlertTitle>}
                  {alertMsg.description && (
                    <AlertDescription fontSize="sm">{alertMsg.description}</AlertDescription>
                  )}
                </Box>
              </Alert>
            </Center>
          )}
          <Center my={6} flexFlow="column" gap={2}>
            <Heading size="md">Your est. revenue</Heading>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, green.400, green.200, green.400)"
              bgClip="text"
            >
              {intl.format(sessionStats.estRevenue)} NP
            </Heading>
            <Heading size="sm">with {intl.format(sessionStats.totalBought.count)} items</Heading>
          </Center>
          <Divider />
          <SimpleGrid mt={3} columns={[2, 3, 3, 5]} spacing={[1, 1, 4]}>
            <StatsCard
              label="Time Spent Restocking"
              stat={msIntervalFormated(sessionStats.durationCount, true)}
              helpText={`${msIntervalFormated(sessionStats.mostPopularShop.durationCount)} at ${
                restockShopInfo[sessionStats.mostPopularShop.shopId].name
              }`}
            />
            <StatsCard
              label="Most Expensive Item Bought"
              stat={`${intl.format(sessionStats.mostExpensiveBought?.price.value ?? 0)} NP`}
              helpText={sessionStats.mostExpensiveBought?.name ?? 'none'}
            />
            <StatsCard
              label="Avg Refresh Time"
              stat={msIntervalFormated(sessionStats.avgRefreshTime, false, 1)}
              helpText={`based on ${sessionStats.totalRefreshes} refreshs`}
            />
            <StatsCard
              label="Total Clicked and Lost"
              stat={`${intl.format(sessionStats.totalLost?.value ?? 0)} NP`}
              helpText={`${intl.format(sessionStats.totalLost.count)} items`}
            />
            <StatsCard
              label="Most Expensive Clicked and Lost"
              stat={`${intl.format(sessionStats.mostExpensiveLost?.price.value ?? 0)} NP`}
              helpText={sessionStats.mostExpensiveLost?.name ?? 'none'}
            />
          </SimpleGrid>
          <Flex mt={6} w="100%" gap={3} flexFlow={['column', 'column', 'row']}>
            <Flex flexFlow={'column'} textAlign={'center'} gap={3} flex={1}>
              <Heading size="md">Hottest Buys</Heading>
              <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                {sessionStats.hottestBought.map((bought, i) => (
                  <RestockItem
                    item={bought.item}
                    clickData={bought.click}
                    restockItem={bought.restockItem}
                    key={i}
                  />
                ))}
              </Flex>
            </Flex>
            <Flex flexFlow={'column'} textAlign={'center'} gap={3} flex={1}>
              <Tabs flex={1} colorScheme="gray" variant={'line'}>
                <TabList>
                  <Tab>Hottest Restocks</Tab>
                  <Tab>Worst Losses</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
                      {sessionStats.hottestRestocks.map((item, i) => (
                        <ItemCard item={item} key={i} />
                      ))}
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                      {sessionStats.hottestLost.map((lost, i) => (
                        <RestockItem
                          item={lost.item}
                          clickData={lost.click}
                          restockItem={lost.restockItem}
                          key={i}
                        />
                      ))}
                      {sessionStats.hottestLost.length === 0 && (
                        <Text fontSize={'xs'} color="gray.400">
                          You didn&apos;t lose anything. You&apos;re awesome!
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Flex>
          </Flex>
          <Flex mt={6} flexFlow="column" justifyContent={'center'} alignItems={'center'} gap={2}>
            <Text fontSize={'xs'} color="gray.400">
              All values are based on current itemdb&apos;s price
            </Text>

            <Button variant="outline" size="sm" onClick={onOpen}>
              <Icon as={FiSend} mr={1} /> Feedback
            </Button>
          </Flex>
        </>
      )}
    </Layout>
  );
};

export default RestockDashboard;

const defaultStats: RestockStats = {
  durationCount: 0,
  mostPopularShop: {
    shopId: 0,
    durationCount: 0,
  },
  totalSessions: 0,
  mostExpensiveBought: undefined,
  mostExpensiveLost: undefined,
  totalRefreshes: 0,
  totalLost: {
    count: 0,
    value: 0,
  },
  totalBought: {
    count: 0,
    value: 0,
  },
  estRevenue: 0,
  avgRefreshTime: 0,
  avgReactionTime: 0,
  hottestRestocks: [],
  hottestBought: [],
  hottestLost: [],
  unknownPrices: 0,
};
