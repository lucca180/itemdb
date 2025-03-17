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
  IconButton,
  HStack,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import Color from 'color';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import NextLink from 'next/link';
import { StatsCard } from '../../../components/Hubs/Restock/StatsCard';
import ItemCard from '../../../components/Items/ItemCard';
import ImportRestockModal from '../../../components/Modal/ImportRestock';
import { RestockChart, RestockSession, RestockStats, User } from '../../../types';
import { useAuth } from '../../../utils/auth';
import axios from 'axios';
import { restockShopInfo } from '../../../utils/utils';
import RestockItem from '../../../components/Hubs/Restock/RestockItemCard';
import { FiSend } from 'react-icons/fi';
import FeedbackModal from '../../../components/Modal/FeedbackModal';
import { createTranslator, useFormatter, useTranslations } from 'next-intl';
import { FaCog, FaEyeSlash, FaFileDownload } from 'react-icons/fa';
// import CalendarHeatmap from '../../../components/Charts/CalHeatmap';
import { endOfDay } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import dynamic from 'next/dynamic';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import { NextApiRequest } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';
import { setCookie } from 'cookies-next/client';
import { getRestockStats } from '../../api/v1/restock';
import { IntervalFormatted } from '../../../components/Utils/IntervalFormatted';

const RestockWrappedModal = dynamic(() => import('../../../components/Modal/RestockWrappedModal'));

const DashboardOptionsModal = dynamic(
  () => import('../../../components/Modal/DashboardOptionsModal')
);

const color = Color('#79dbaf').rgb().array();

const MIN_SCRIPT_VERSION = 201;

type AlertMsg = {
  title?: ReactElement | string;
  description?: ReactElement | string;
  type: 'loading' | 'info' | 'warning' | 'success' | 'error' | undefined;
};

type PeriodFilter = { timePeriod: number; shops: number | string; timestamp: number | null };

const defaultFilter: PeriodFilter = { timePeriod: 30, shops: 'all', timestamp: null };

type RestockDashboardProps = {
  messages: Record<string, string>;
  locale: string;
  initialFilter: PeriodFilter;
  initialCurrentStats?: RestockStats | null;
  initialPastStats?: RestockStats | null;
  user?: User;
  tip: {
    _id: string;
    tag: string;
    href: string;
  };
};

const RestockDashboard = (props: RestockDashboardProps) => {
  const { user } = props;
  const t = useTranslations();
  const formatter = useFormatter();
  const { userPref } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenOptions, onOpen: onOpenOptions, onClose: onCloseOptions } = useDisclosure();
  const { isOpen: isWrappedOpen, onOpen: onWrappedOpen, onClose: onWrappedClose } = useDisclosure();
  const [openImport, setOpenImport] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<RestockStats | null>(
    props.initialCurrentStats ?? null
  );
  const [pastSessionStats, setPastSessionStats] = useState<RestockStats | null>(
    props.initialPastStats ?? null
  );

  const [alertMsg, setAlertMsg] = useState<AlertMsg | null>(null);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [shopList, setShopList] = useState<number[]>(props.initialCurrentStats?.shopList ?? []);
  const [noScript, setNoScript] = useState<'notFound' | 'outdated' | null>(null);
  const [filter, setFilter] = useState<PeriodFilter | null>(props.initialFilter);
  const [chartData, setChartData] = useState<RestockChart | null>(null);

  const revenueDiff = useMemo(() => {
    if (!sessionStats || !pastSessionStats) return null;
    const diff = sessionStats.estRevenue - pastSessionStats.estRevenue;
    const diffPercentage = Math.abs(diff / pastSessionStats.estRevenue) * 100;

    return {
      diff,
      diffPercentage,
      isPositive: diff > 0,
    };
  }, [sessionStats, pastSessionStats]);

  const profitDiff = useMemo(() => {
    if (
      !sessionStats ||
      !pastSessionStats ||
      !sessionStats.estProfit ||
      !pastSessionStats.estProfit
    )
      return null;
    const diff = sessionStats.estProfit - pastSessionStats.estProfit;
    const diffPercentage = Math.abs(diff / pastSessionStats.estProfit) * 100;

    return {
      diff,
      diffPercentage,
      isPositive: diff > 0,
    };
  }, [sessionStats, pastSessionStats]);

  useEffect(() => {
    if (!user) return;

    setTimeout(() => {
      handleImport();
      track();
    }, 2000);

    if (!sessionStats) init();
  }, []);

  const init = async (customFilter?: PeriodFilter) => {
    customFilter = customFilter ?? filter ?? defaultFilter;
    setAlertMsg({ type: 'loading', title: t('Restock.loading-your-restock-sessions') });
    try {
      const dataProm = axios.get('/api/v1/restock', {
        params: {
          startDate:
            customFilter.timestamp ?? Date.now() - customFilter.timePeriod * 24 * 60 * 60 * 1000,
          endDate: customFilter.timestamp
            ? endOfDay(new UTCDate(customFilter.timestamp)).getTime()
            : undefined,
          shopId: customFilter.shops === 'all' ? undefined : customFilter.shops,
        },
      });

      // temp disable chart
      const chartProm = !chartData && false ? axios.get('/api/v1/restock/chart') : undefined;

      const [res, chartRes] = await Promise.all([dataProm, chartProm]);

      if (!res.data) {
        setAlertMsg({
          type: 'warning',
          description: (
            <>
              {t('Restock.you-have-no-restock-sessions-for-the-selected-period')}
              <br />
              {t('Restock.try-another-period-or-import-your-sessions')}
            </>
          ),
        });
        return;
      }

      const statsData = res.data.currentStats as RestockStats;
      const pastData = res.data.pastStats as RestockStats | undefined;
      const chartsData = chartRes?.data as RestockChart;

      if (chartsData) setChartData(chartsData);

      if (customFilter.shops === 'all') setShopList(statsData.shopList);
      if (pastData && !userPref?.dashboard_hidePrev) setPastSessionStats(pastData);
      else setPastSessionStats(null);

      setSessionStats(statsData);
      setAlertMsg(null);
    } catch (err) {
      console.error(err);
      setAlertMsg({
        type: 'error',
        description: (
          <>
            {t('Restock.something-went-wrong-while-loading-your-restock-sessions')}
            <br />
            {t('General.try-again-later')}
          </>
        ),
      });
    }
  };

  const handleImport = () => {
    if (!window) return;
    let currentParsed: RestockSession[] = [];
    let unsyncParsed: RestockSession[] = [];

    if (!window.itemdb_restock) {
      console.warn('itemdb_restock not found');
      setNoScript('notFound');
      setImportCount(0);
      return;
    }

    const { current_sessions, unsync_sessions } = window.itemdb_restock.getSessions();
    currentParsed = Object.values(current_sessions);
    unsyncParsed = unsync_sessions;

    const versionCode =
      window.itemdb_restock.versionCode ?? window.itemdb_restock.scriptVersion ?? 0;

    if (versionCode < MIN_SCRIPT_VERSION) {
      console.warn('itemdb_restock version outdated');
      setNoScript('outdated');
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

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    init({ ...(filter ?? defaultFilter), [name]: value, timestamp: null });

    setFilter((prev) => ({ ...(prev ?? defaultFilter), [name]: value, timestamp: null }));

    setCookie('restockFilter2025', JSON.stringify({ ...filter, [name]: value, timestamp: null }), {
      expires: new Date('2030-01-01'),
    });
  };

  const track = async () => {
    if (!window.umami || !user) return;

    const umami = window.umami;

    await umami.identify({
      id: user.id,
      restockScript:
        window.itemdb_restock?.versionCode ?? window.itemdb_restock?.scriptVersion ?? null,
      itemdbScript: window.itemdb_script?.version ?? null,
    });
  };

  return (
    <>
      {openImport && (
        <ImportRestockModal isOpen={openImport} onClose={handleClose} refresh={refresh} />
      )}
      {isOpen && <FeedbackModal isOpen={isOpen} onClose={onClose} />}
      {isOpenOptions && <DashboardOptionsModal isOpen={isOpenOptions} onClose={onCloseOptions} />}
      {!!sessionStats && isWrappedOpen && (
        <RestockWrappedModal
          timePeriod={filter?.timePeriod}
          isOpen={isWrappedOpen}
          onClose={onWrappedClose}
          stats={sessionStats}
        />
      )}
      <Box
        position="absolute"
        h="75vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Flex
        gap={2}
        alignItems="center"
        justifyContent={['center', 'center', 'flex-end']}
        my={2}
        flexWrap={'wrap'}
      >
        {user && (
          <Button
            size="sm"
            bg="blackAlpha.500"
            fontWeight={'400'}
            color="green.100"
            borderRadius={'3xl'}
            _hover={{ bg: 'blackAlpha.300' }}
            onClick={() => setOpenImport(true)}
            isDisabled={!importCount}
            isLoading={importCount === null}
          >
            {t('Restock.import-x-sessions', { x: importCount })}
          </Button>
        )}
        <Select
          maxW="170px"
          variant={'filled'}
          colorScheme="blackAlpha"
          bg="blackAlpha.500"
          color="green.100"
          size="sm"
          borderRadius={'3xl'}
          name="timePeriod"
          value={(filter ?? defaultFilter).timePeriod}
          onChange={handleSelectChange}
          _hover={{ bg: 'blackAlpha.300' }}
          _focusVisible={{ bg: 'blackAlpha.300' }}
          sx={{ option: { color: 'white' } }}
        >
          {filter?.timestamp && (
            <option value={filter.timePeriod}>{formatter.dateTime(filter.timestamp)}</option>
          )}
          <option value={0.08325}>{t('General.last-x-hours', { x: 2 })}</option>
          <option value={0.5}>{t('General.last-x-hours', { x: 12 })}</option>
          <option value={1}>{t('General.last-x-hours', { x: 24 })}</option>
          <option value={7}>{t('General.last-x-days', { x: 7 })}</option>
          <option value={30}>{t('General.last-x-days', { x: 30 })}</option>
          <option value={60}>{t('General.last-x-days', { x: 60 })}</option>
          <option value={90}>{t('General.last-x-days', { x: 90 })}</option>
        </Select>
        <Select
          maxW="150px"
          variant={'filled'}
          bg="blackAlpha.500"
          color="green.100"
          size="sm"
          borderRadius={'3xl'}
          name="shops"
          value={(filter ?? defaultFilter).shops}
          onChange={handleSelectChange}
          _hover={{ bg: 'blackAlpha.300' }}
          _focusVisible={{ bg: 'blackAlpha.300' }}
          sx={{ option: { color: 'white' } }}
        >
          <option value="all">{t('Restock.all-shops')}</option>
          {shopList.map((shopId) => (
            <option key={shopId} value={shopId}>
              {restockShopInfo[shopId].name}
            </option>
          ))}
        </Select>
        {sessionStats && (
          <>
            <IconButton
              bg="blackAlpha.500"
              color="green.100"
              aria-label="Open Dashboard Options"
              icon={<FaCog />}
              onClick={onOpenOptions}
              size="sm"
            />
            <IconButton
              bg="blackAlpha.500"
              color="green.100"
              aria-label="Restock Wrapped Button"
              onClick={onWrappedOpen}
              icon={<FaFileDownload />}
              size="sm"
            />
          </>
        )}
      </Flex>
      {noScript && (
        <Center flexFlow={'column'} my={3}>
          <Alert
            status={noScript === 'outdated' ? 'warning' : 'error'}
            maxW="500px"
            variant="subtle"
            borderRadius={'md'}
            bg={'blackAlpha.500'}
          >
            <AlertIcon />
            <Box w="100%">
              <AlertDescription fontSize="sm">
                {t.rich(
                  noScript === 'outdated' ? 'Restock.outdated-script' : 'Restock.no-script-error',
                  {
                    Link: (chunk) => (
                      <Link
                        href="https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js"
                        color={noScript === 'outdated' ? 'yellow.100' : 'red.200'}
                        isExternal
                      >
                        {chunk}
                      </Link>
                    ),
                    Help: (chunk) => (
                      <Link
                        href="/articles/help-my-scripts-are-not-working"
                        color="red.200"
                        target="_blank"
                      >
                        {chunk}
                      </Link>
                    ),
                  }
                )}
              </AlertDescription>
            </Box>
            <CloseButton
              alignSelf="flex-start"
              position="relative"
              right={0}
              top={-1}
              onClick={() => setNoScript(null)}
            />
          </Alert>
        </Center>
      )}
      {!sessionStats && (
        <>
          <Center flexFlow={'column'} gap={2}>
            <Heading size="lg">{t('Restock.itemdbs-restock-dashboard')}</Heading>
            <Text>{t('Restock.text-1')}</Text>
          </Center>
          <Divider my={6} />

          {alertMsg && (
            <Center flexFlow={'column'} my={3}>
              <Alert
                status={alertMsg.type}
                maxW="500px"
                variant="subtle"
                borderRadius={'md'}
                bg={'blackAlpha.500'}
              >
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

          <Heading size="md">{t('Restock.how-to-use')}</Heading>
          <Alert
            status="warning"
            borderRadius={'md'}
            maxW="750px"
            my={4}
            fontSize="sm"
            sx={{ a: { color: 'yellow.200' } }}
            bg={'blackAlpha.500'}
          >
            <AlertIcon />
            <Box>
              <AlertTitle>Manifest V3</AlertTitle>
              <AlertDescription>
                {t.rich('Feedback.manifest-v3-text', {
                  Link: (chunk) => (
                    <Link href="/articles/help-my-scripts-are-not-working" isExternal>
                      {chunk}
                    </Link>
                  ),
                })}
              </AlertDescription>
            </Box>
          </Alert>
          <UnorderedList
            mt={3}
            pl={3}
            sx={{ a: { color: 'green.200' }, b: { color: 'green.200' } }}
            spacing={2}
          >
            {!user && (
              <ListItem>
                <Text>
                  {t.rich('Restock.text-2', {
                    Link: (chunk) => (
                      <Link as={NextLink} href="/login">
                        {chunk}
                      </Link>
                    ),
                  })}
                </Text>
              </ListItem>
            )}
            <ListItem>
              {t.rich('Restock.text-3', {
                Link: (chunk) => (
                  <Link as={NextLink} href="https://www.tampermonkey.net/" isExternal>
                    {chunk}
                  </Link>
                ),
              })}
            </ListItem>
            <ListItem>
              <Text>
                {t.rich('Restock.text-4', {
                  Link: (chunk) => (
                    <Link
                      as={NextLink}
                      href="https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js"
                      isExternal
                    >
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {t('Restock.text-5')}
                <br />
                {t('Restock.text-6')}{' '}
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                {t.rich('Restock.text-7', {
                  Link: (chunk) => (
                    <Link
                      as={NextLink}
                      href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
                      isExternal
                    >
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {t.rich('Restock.text-8', {
                  Link: (chunk) => (
                    <Link as={NextLink} href="/contribute">
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>
            </ListItem>
            <ListItem>
              <Text>{t('Restock.go-restock')} </Text>
              <Text fontSize="sm" color="gray.400">
                {t.rich('Restock.text-9', {
                  Link: (chunk) => (
                    <Link as={NextLink} href="/restock">
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                {t.rich('Restock.text-10', {
                  b: (chunk) => <b>{chunk}</b>,
                })}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {t('Restock.text-11')}
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
          <Flex mb={8} mt={{ base: 8, md: 1 }} flexFlow="column" gap={2}>
            <Heading size="md" color="green.100">
              {t('Restock.your-estimate-profit')}
            </Heading>
            <HStack>
              <Heading
                size="3xl"
                filter={'drop-shadow(0 0 5px rgba(0, 0, 0, 0.4))'}
                color="green.200"
              >
                {formatter.number(sessionStats.estProfit ?? sessionStats.estRevenue)} NP
              </Heading>
              {(profitDiff ?? revenueDiff) && (
                <Tooltip
                  hasArrow
                  label={t('Restock.from-x-with-y-items', {
                    0: formatter.number(
                      pastSessionStats!.estProfit ?? pastSessionStats!.estRevenue
                    ),
                    1: pastSessionStats!.totalBought.count,
                  })}
                  bg="blackAlpha.900"
                  fontSize={'xs'}
                  placement="top"
                  color="white"
                >
                  <Badge
                    variant={'solid'}
                    color={(profitDiff ?? revenueDiff)!.isPositive ? 'green.100' : 'red.200'}
                    bg={'blackAlpha.500'}
                    p={1}
                    borderRadius={'lg'}
                    display="flex"
                    alignItems={'center'}
                  >
                    <Icon
                      as={
                        (profitDiff ?? revenueDiff)!.isPositive ? FaArrowTrendUp : FaArrowTrendDown
                      }
                      mr={1}
                    />
                    {(profitDiff ?? revenueDiff)!.diffPercentage.toFixed(0)}%
                  </Badge>
                </Tooltip>
              )}
            </HStack>
            <HStack mt={3} fontSize={'sm'} fontWeight={'500'} color="green.100" flexWrap={'wrap'}>
              <Flex py={2} px={4} bg={'blackAlpha.500'} borderRadius={'3xl'}>
                {t('Restock.x-items-bought', {
                  0: formatter.number(sessionStats.totalBought.count),
                })}
              </Flex>
              <Flex py={2} px={4} bg={'blackAlpha.500'} borderRadius={'3xl'}>
                {t('Restock.x-np-spent', {
                  0: formatter.number(sessionStats.totalSpent ?? 0),
                })}
              </Flex>
              <Flex
                py={2}
                px={5}
                bg={'blackAlpha.500'}
                borderRadius={'3xl'}
                textTransform={'capitalize'}
              >
                {t.rich('Restock.x-time-restocking', {
                  Val: () => <IntervalFormatted ms={sessionStats.durationCount} long />,
                })}
              </Flex>
            </HStack>
          </Flex>
          <Divider />
          <SimpleGrid mt={3} columns={[2, 2, 2, 4, 4]} spacing={[2, 3]}>
            <StatsCard type="reactionTime" session={sessionStats} pastSession={pastSessionStats} />
            <StatsCard type="fastestBuy" session={sessionStats} pastSession={pastSessionStats} />
            <StatsCard type="refreshTime" session={sessionStats} pastSession={pastSessionStats} />
            <StatsCard type="bestBuy" session={sessionStats} pastSession={pastSessionStats} />
            <StatsCard
              type="clickedAndLost"
              blur={userPref?.dashboard_hideMisses}
              session={sessionStats}
              pastSession={pastSessionStats}
            />
            <StatsCard
              type="worstClickedAndLost"
              blur={userPref?.dashboard_hideMisses}
              session={sessionStats}
              pastSession={pastSessionStats}
            />
            <StatsCard type="favoriteBuy" session={sessionStats} pastSession={pastSessionStats} />
            <StatsCard type="savedHaggling" session={sessionStats} pastSession={pastSessionStats} />
          </SimpleGrid>
          <Text textAlign={'center'} fontSize="xs" color="whiteAlpha.600" mt={6}>
            {t('General.tip')}:{' '}
            {t.rich(props.tip.tag, {
              Link: (chunk) => (
                <Link
                  as={NextLink}
                  href={props.tip.href + '?utm_content=site-tip'}
                  color="whiteAlpha.800"
                  target="_blank"
                  prefetch={false}
                >
                  {chunk}
                </Link>
              ),
            })}
          </Text>
          <Flex mt={6} w="100%" gap={3} flexFlow={['column', 'column', 'row']}>
            <Flex flexFlow={'column'} textAlign={'center'} gap={3} flex={1}>
              <Heading size="md">{t('Restock.hottest-buys')}</Heading>
              <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                {sessionStats.hottestBought.map((bought, i) => (
                  <RestockItem
                    disablePrefetch
                    item={bought.item}
                    clickData={bought.click}
                    restockItem={bought.restockItem}
                    key={i}
                  />
                ))}
              </Flex>
            </Flex>
            <Flex flexFlow={'column'} textAlign={'center'} gap={3} flex={1}>
              <Tabs flex={1} colorScheme="green" variant={'soft-rounded'}>
                <TabList>
                  <Tab
                    color="green.50"
                    opacity={'0.5'}
                    _selected={{ color: 'green.100', bg: 'blackAlpha.500', opacity: 1 }}
                  >
                    {t('Restock.hottest-restocks')}
                  </Tab>
                  <Tab
                    color="green.50"
                    opacity={'0.5'}
                    _selected={{ color: 'green.100', bg: 'blackAlpha.500', opacity: 1 }}
                  >
                    {t('Restock.worst-losses')}
                  </Tab>
                  <Tab
                    color="green.50"
                    opacity={'0.5'}
                    _selected={{ color: 'green.100', bg: 'blackAlpha.500', opacity: 1 }}
                  >
                    {t('Restock.worst-baits')}
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <Flex flexFlow={'column'} gap={3}>
                      <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
                        {userPref?.dashboard_hideMisses && (
                          <Center flexFlow="column" h="300px">
                            <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                            <Text fontSize={'sm'} color="gray.400"></Text>
                          </Center>
                        )}
                        {!userPref?.dashboard_hideMisses &&
                          sessionStats.hottestRestocks.map((item, i) => (
                            <ItemCard disablePrefetch item={item} key={i} />
                          ))}
                      </Flex>
                      <Text fontSize={'sm'}>
                        {t.rich('Restock.history-dashboard-cta', {
                          Link: (chunk) => (
                            <Link
                              color="green.200"
                              as={NextLink}
                              isExternal
                              href={`/restock/${sessionStats.mostPopularShop.shopId}/history`}
                            >
                              {chunk}
                            </Link>
                          ),
                        })}
                      </Text>
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                      {userPref?.dashboard_hideMisses && (
                        <Center flexFlow="column" h="300px">
                          <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                        </Center>
                      )}
                      {!userPref?.dashboard_hideMisses &&
                        sessionStats.hottestLost.map((lost, i) => (
                          <RestockItem
                            disablePrefetch
                            item={lost.item}
                            clickData={lost.click}
                            restockItem={lost.restockItem}
                            key={i}
                          />
                        ))}
                      {!userPref?.dashboard_hideMisses && sessionStats.hottestLost.length === 0 && (
                        <Text fontSize={'xs'} color="gray.400">
                          {t('Restock.you-didnt-lose-anything-youre-awesome')}
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                      {userPref?.dashboard_hideMisses && (
                        <Center flexFlow="column" h="300px">
                          <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                        </Center>
                      )}
                      {!userPref?.dashboard_hideMisses &&
                        sessionStats.worstBaits.map((bait, i) => (
                          <RestockItem
                            disablePrefetch
                            item={bait.item}
                            clickData={bait.click}
                            restockItem={bait.restockItem}
                            key={i}
                          />
                        ))}
                      {!userPref?.dashboard_hideMisses && sessionStats.worstBaits.length === 0 && (
                        <Text fontSize={'xs'} color="gray.400">
                          {t('Restock.you-didnt-fall-for-any-bait-items')}
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Flex>
          </Flex>
          {/* {chartData && <CalendarHeatmap onClick={setCustomTimestamp} chartData={chartData} />} */}
          <Flex mt={6} flexFlow="column" justifyContent={'center'} alignItems={'center'} gap={2}>
            <Text fontSize={'xs'} color="gray.400">
              {t('Restock.all-values-are-based-on-current-itemdbs-price')}
            </Text>

            <Button variant="outline" size="sm" onClick={onOpen}>
              <Icon as={FiSend} mr={1} /> {t('Button.feedback')}
            </Button>
          </Flex>
        </>
      )}
    </>
  );
};

export default RestockDashboard;

export async function getServerSideProps(context: any): Promise<{ props: RestockDashboardProps }> {
  let res;

  const tip = tipList[Math.floor(Math.random() * tipList.length)];

  const filter: PeriodFilter = {
    ...defaultFilter,
    ...JSON.parse(context.req.cookies.restockFilter2025 || '{}'),
    shops: 'all',
  };

  try {
    res = await CheckAuth(context.req as NextApiRequest);
  } catch (e) {}

  if (!res || !res.user) {
    return {
      props: {
        tip,
        messages: (await import(`../../../translation/${context.locale}.json`)).default,
        initialFilter: filter,
        locale: context.locale,
      },
    };
  }

  const user = res.user;

  const data = await getRestockStats({
    user: user,
    startDate: filter.timestamp ?? Date.now() - (filter.timePeriod ?? 7) * 24 * 60 * 60 * 1000,
    endDate: filter.timestamp ? endOfDay(new UTCDate(filter.timestamp)).getTime() : undefined,
    shopId: filter.shops === 'all' ? undefined : filter.shops,
  });

  return {
    props: {
      tip,
      messages: (await import(`../../../translation/${context.locale}.json`)).default,
      user: user,
      locale: context.locale,
      initialFilter: filter,
      initialCurrentStats: data?.currentStats ?? null,
      initialPastStats: data?.pastStats ?? null,
    },
  };
}

RestockDashboard.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('Restock.neopets-restock-dashboard'),
        description: t('Restock.restock-dashboard-desc'),
        themeColor: '#66bf9c',
      }}
      mainColor="#66bf9cb8"
    >
      {page}
    </Layout>
  );
};

const tipList = [
  {
    _id: 'Advanced Operators',
    tag: 'Search.tip-advanced-operators',
    href: '/articles/advanced-search-queries',
  },
  {
    _id: 'Dynamic Lists',
    tag: 'Search.tip-dynamic-lists',
    href: '/articles/checklists-and-dynamic-lists',
  },
  {
    _id: 'Price Calculator',
    tag: 'Search.tip-price-calculator',
    href: '/tools/price-calculator',
  },
  {
    _id: 'Advanced Import',
    tag: 'Search.tip-advanced-import',
    href: '/lists/import/advanced',
  },
];
