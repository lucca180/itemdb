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
} from '@chakra-ui/react';
import Color from 'color';
import { ReactElement, useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import NextLink from 'next/link';
import { StatsCard } from '../../../components/Hubs/Restock/StatsCard';
import ItemCard from '../../../components/Items/ItemCard';
import ImportRestockModal from '../../../components/Modal/ImportRestock';
import { RestockChart, RestockSession, RestockStats } from '../../../types';
import { useAuth } from '../../../utils/auth';
import axios from 'axios';
import { msIntervalFormated, restockShopInfo } from '../../../utils/utils';
import RestockItem from '../../../components/Hubs/Restock/RestockItemCard';
import { FiSend } from 'react-icons/fi';
import FeedbackModal from '../../../components/Modal/FeedbackModal';
import { useFormatter, useTranslations } from 'next-intl';
import { FaEye, FaEyeSlash, FaFileImage } from 'react-icons/fa';
// import CalendarHeatmap from '../../../components/Charts/CalHeatmap';
import { endOfDay } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { RestockWrappedModalProps } from '../../../components/Modal/RestockWrappedModal';
import dynamic from 'next/dynamic';

const RestockWrappedModal = dynamic<RestockWrappedModalProps>(
  () => import('../../../components/Modal/RestockWrappedModal')
);

const color = Color('#599379').rgb().array();

const MIN_SCRIPT_VERSION = 108;

type AlertMsg = {
  title?: ReactElement | string;
  description?: ReactElement | string;
  type: 'loading' | 'info' | 'warning' | 'success' | 'error' | undefined;
};

type PeriodFilter = { timePeriod: number; shops: number | string; timestamp?: number };
const intl = new Intl.NumberFormat();

const defaultFilter: PeriodFilter = { timePeriod: 7, shops: 'all', timestamp: undefined };

const RestockDashboard = () => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isWrappedOpen, onOpen: onWrappedOpen, onClose: onWrappedClose } = useDisclosure();
  const [openImport, setOpenImport] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<RestockStats | null>(null);
  const [alertMsg, setAlertMsg] = useState<AlertMsg | null>(null);
  const [importCount, setImportCount] = useState<number>(0);
  const [shopList, setShopList] = useState<number[]>([]);
  const [noScript, setNoScript] = useState<boolean>(false);
  const [hideMisses, setHideMisses] = useState<boolean>(false);
  const [filter, setFilter] = useState<PeriodFilter | null>(null);
  const [chartData, setChartData] = useState<RestockChart | null>(null);

  useEffect(() => {
    if (!authLoading && user && !!filter) {
      handleImport();
      init();
    }
  }, [user, authLoading, !!filter]);

  useEffect(() => {
    const hideMisses = localStorage.getItem('hideMisses');
    if (hideMisses) setHideMisses(hideMisses === 'true');

    const storageFilter = localStorage.getItem('restockFilter');
    let timePeriod = storageFilter ? JSON.parse(storageFilter)?.timePeriod || 7 : 7;
    if (timePeriod === 90) timePeriod = 30;
    if (storageFilter) setFilter({ ...defaultFilter, timePeriod: timePeriod });
    else setFilter(defaultFilter);
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

      const statsData = res.data as RestockStats;
      const chartsData = chartRes?.data as RestockChart;

      if (chartsData) setChartData(chartsData);

      if (!statsData) {
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

      if (customFilter.shops === 'all') setShopList(statsData.shopList);

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

    if (window.itemdb_restock) {
      const { current_sessions, unsync_sessions } = window.itemdb_restock.getSessions();
      currentParsed = Object.values(current_sessions);
      unsyncParsed = unsync_sessions;

      if (
        !window.itemdb_restock.scriptVersion ||
        window.itemdb_restock.scriptVersion < MIN_SCRIPT_VERSION
      ) {
        console.warn('itemdb_restock version outdated');
        setNoScript(true);
      }
    } else {
      console.warn('itemdb_restock not found');
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    init({ ...(filter ?? defaultFilter), [name]: value, timestamp: undefined });
    setFilter((prev) => ({ ...(prev ?? defaultFilter), [name]: value, timestamp: undefined }));
    localStorage.setItem(
      'restockFilter',
      JSON.stringify({ ...filter, [name]: value, timestamp: undefined })
    );
  };

  const toggleMisses = () => {
    const newMisses = !hideMisses;
    setHideMisses(newMisses);
    localStorage.setItem('hideMisses', newMisses.toString());
  };

  // const setCustomTimestamp = (timestamp: number) => {
  //   init({ ...defaultFilter, timestamp });
  //   setFilter({ ...defaultFilter, timestamp });
  //   window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  // };

  return (
    <Layout
      SEO={{
        title: t('Restock.neopets-restock-dashboard'),
        description: t('Restock.restock-dashboard-desc'),
        themeColor: '#599379',
      }}
    >
      {openImport && (
        <ImportRestockModal isOpen={openImport} onClose={handleClose} refresh={refresh} />
      )}
      {isOpen && <FeedbackModal isOpen={isOpen} onClose={onClose} />}
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
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Text fontSize="xs" mt={2}>
        <Link as={NextLink} href="/restock">
          ← {t('Restock.back-to-restock-hub')}
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
          value={(filter ?? defaultFilter).timePeriod}
          onChange={handleSelectChange}
        >
          {filter?.timestamp && (
            <option value={filter.timePeriod}>{formatter.dateTime(filter.timestamp)}</option>
          )}
          <option value={0.5}>{t('General.last-x-hours', { x: 12 })}</option>
          <option value={1}>{t('General.last-x-hours', { x: 24 })}</option>
          <option value={7}>{t('General.last-x-days', { x: 7 })}</option>
          <option value={30}>{t('General.last-x-days', { x: 30 })}</option>
          {/* <option value={60}>{t('General.last-x-days', { x: 60 })}</option> */}
          {/* <option>All Time</option> */}
        </Select>
        <Select
          maxW="150px"
          variant={'filled'}
          bg="blackAlpha.300"
          size="xs"
          borderRadius={'sm'}
          name="shops"
          value={(filter ?? defaultFilter).shops}
          onChange={handleSelectChange}
        >
          <option value="all">{t('Restock.all-shops')}</option>
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
            {t('Restock.import-x-sessions', { x: importCount })}
          </Button>
        )}
        {sessionStats && (
          <HStack gap={1}>
            <IconButton
              bg="blackAlpha.300"
              aria-label="toggle visibility"
              icon={hideMisses ? <FaEyeSlash /> : <FaEye />}
              onClick={toggleMisses}
              fontSize="16px"
              size="sm"
            />
            <Text onClick={toggleMisses} fontSize={'xs'} cursor="pointer">
              {hideMisses ? t('Restock.show-misses') : t('Restock.hide-misses')}
            </Text>
          </HStack>
        )}
      </Flex>
      {noScript && (
        <Center flexFlow={'column'} my={3}>
          <Alert status={'warning'} maxW="500px" variant="subtle" borderRadius={'md'}>
            <AlertIcon />
            <Box w="100%">
              <AlertDescription fontSize="sm">
                {t.rich('Restock.outdated-script', {
                  Link: (chunk) => (
                    <Link
                      href="https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js"
                      color="yellow.100"
                      isExternal
                    >
                      {chunk}
                    </Link>
                  ),
                })}
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
            <Heading size="lg">{t('Restock.itemdbs-restock-dashboard')}</Heading>
            <Text>{t('Restock.text-1')}</Text>
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

          <Heading size="md">{t('Restock.how-to-use')}</Heading>
          <Alert
            status="warning"
            borderRadius={'md'}
            maxW="750px"
            my={4}
            fontSize="sm"
            sx={{ a: { color: 'green.200' } }}
          >
            <AlertIcon />
            <Box>
              <AlertTitle>Manifest V3</AlertTitle>
              <AlertDescription>
                {t.rich('Feedback.manifest-v3-text', {
                  Link: (chunk) => (
                    <Link href="https://www.tampermonkey.net/faq.php#Q209" isExternal>
                      {chunk}
                    </Link>
                  ),
                })}
              </AlertDescription>
            </Box>
          </Alert>
          <UnorderedList mt={3} pl={3} sx={{ a: { color: 'green.200' } }} spacing={2}>
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
            <Heading size="md">{t('Restock.your-est-revenue')}</Heading>
            <HStack>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, green.400, green.200, green.400)"
                bgClip="text"
              >
                {intl.format(sessionStats.estRevenue)} NP
              </Heading>
              <IconButton
                size="sm"
                aria-label="Restock Dashboard Button"
                onClick={onWrappedOpen}
                icon={<FaFileImage />}
              />
            </HStack>
            <Heading size="sm">
              {t('Restock.with-x-items', {
                x: intl.format(sessionStats.totalBought.count),
              })}
            </Heading>
          </Center>
          <Divider />
          <SimpleGrid mt={3} columns={[2, 3, 3, 5]} spacing={[1, 1, 4]}>
            <StatsCard
              label={t('Restock.avg-reaction-time')}
              stat={msIntervalFormated(sessionStats.avgReactionTime, true, 2)}
              helpText={t('Restock.based-on-x-clicks', {
                x: intl.format(sessionStats.totalClicks),
              })}
            />
            {/* <StatsCard
              label={t('Restock.time-spent-restocking')}
              stat={msIntervalFormated(sessionStats.durationCount, true)}
              helpText={`${msIntervalFormated(sessionStats.mostPopularShop.durationCount)} ${t(
                'Restock.at'
              )} ${restockShopInfo[sessionStats.mostPopularShop.shopId].name}`}
            /> */}
            <StatsCard
              label={t('Restock.most-expensive-item-bought')}
              stat={`${intl.format(sessionStats.mostExpensiveBought?.price.value ?? 0)} NP`}
              helpText={sessionStats.mostExpensiveBought?.name ?? t('Restock.none')}
            />
            <StatsCard
              label={t('Restock.avg-refresh-time')}
              stat={msIntervalFormated(sessionStats.avgRefreshTime, false, 1)}
              helpText={t('Restock.based-on-x-refreshs', {
                x: intl.format(sessionStats.totalRefreshes),
              })}
            />
            <StatsCard
              label={t('Restock.total-clicked-and-lost')}
              stat={`${intl.format(sessionStats.totalLost?.value ?? 0)} NP`}
              helpText={`${intl.format(sessionStats.totalLost.count)} ${t('General.items')}`}
              blur={hideMisses}
            />
            <StatsCard
              label={t('Restock.most-expensive-clicked-and-lost')}
              stat={`${intl.format(sessionStats.mostExpensiveLost?.price.value ?? 0)} NP`}
              helpText={sessionStats.mostExpensiveLost?.name ?? t('Restock.none')}
              blur={hideMisses}
            />
          </SimpleGrid>
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
              <Tabs flex={1} colorScheme="gray" variant={'line'}>
                <TabList>
                  <Tab>{t('Restock.hottest-restocks')}</Tab>
                  <Tab>{t('Restock.worst-losses')}</Tab>
                  <Tab>{t('Restock.worst-baits')}</Tab>
                  <Tab>❤️</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <Flex flexFlow={'column'} gap={3}>
                      <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
                        {hideMisses && (
                          <Center flexFlow="column" h="300px">
                            <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                            <Text fontSize={'sm'} color="gray.400"></Text>
                          </Center>
                        )}
                        {!hideMisses &&
                          sessionStats.hottestRestocks.map((item, i) => (
                            <ItemCard disablePrefetch item={item} key={i} />
                          ))}
                      </Flex>
                      <Text fontSize={'sm'}>
                        <Badge colorScheme="green">{t('Layout.new')}</Badge>{' '}
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
                      {hideMisses && (
                        <Center flexFlow="column" h="300px">
                          <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                        </Center>
                      )}
                      {!hideMisses &&
                        sessionStats.hottestLost.map((lost, i) => (
                          <RestockItem
                            disablePrefetch
                            item={lost.item}
                            clickData={lost.click}
                            restockItem={lost.restockItem}
                            key={i}
                          />
                        ))}
                      {!hideMisses && sessionStats.hottestLost.length === 0 && (
                        <Text fontSize={'xs'} color="gray.400">
                          {t('Restock.you-didnt-lose-anything-youre-awesome')}
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex gap={3} flexFlow="column" justifyContent={'center'}>
                      {hideMisses && (
                        <Center flexFlow="column" h="300px">
                          <Icon as={FaEyeSlash} fontSize="50px" color="gray.600" />
                        </Center>
                      )}
                      {!hideMisses &&
                        sessionStats.worstBaits.map((bait, i) => (
                          <RestockItem
                            disablePrefetch
                            item={bait.item}
                            clickData={bait.click}
                            restockItem={bait.restockItem}
                            key={i}
                          />
                        ))}
                      {!hideMisses && sessionStats.worstBaits.length === 0 && (
                        <Text fontSize={'xs'} color="gray.400">
                          {t('Restock.you-didnt-fall-for-any-bait-items')}
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex
                      gap={3}
                      px={4}
                      flexFlow="column"
                      textAlign={'center'}
                      alignItems={'center'}
                      sx={{ a: { color: 'green.200' } }}
                    >
                      <Heading size="md">❤️</Heading>
                      <Heading size="sm">{t('Restock.enjoying-restock-dashboard')}</Heading>
                      <Text fontSize={'sm'}>{t('Restock.cta-1')}</Text>
                      <Link fontSize={'sm'} href="/feedback/trades" isExternal>
                        {t('Restock.pricing-trade-lots')}
                      </Link>
                      <Link fontSize={'sm'} href="/feedback/vote" isExternal>
                        {t('Restock.vote-on-pricing-suggestions')}
                      </Link>
                      <Link fontSize={'sm'} href="/contribute" isExternal>
                        {t('Restock.item-data-extractor-script')}
                      </Link>
                      <Text fontSize={'sm'}>{t('Restock.cta-2')}</Text>
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
    </Layout>
  );
};

export default RestockDashboard;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../../translation/${context.locale}.json`)).default,
    },
  };
}
