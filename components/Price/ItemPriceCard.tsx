import {
  Icon,
  Flex,
  HStack,
  IconButton,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Center,
  SkeletonText,
  useDisclosure,
  Button,
  Badge,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CloseButton,
  useToast,
  Box,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ItemData, ItemLastSeen, PriceData, PricingInfo, UserList } from '../../types';
import { ChartComponentProps } from '../Charts/PriceChart';
import { AiOutlineAreaChart, AiOutlineTable } from 'react-icons/ai';
import PriceTable from './PriceTable';
import { MinusIcon } from '@chakra-ui/icons';
import CardBase from '../Card/CardBase';
import { MdHelp, MdMoneyOff, MdOutlineAdd } from 'react-icons/md';
import dynamic from 'next/dynamic';
import { LastSeenModalProps } from '../Modal/LastSeenModal';
import { useFormatter, useTranslations } from 'next-intl';
import { WrongPriceModalProps } from '../Modal/WrongPriceModal';
import { AdminEditPriceModalProps } from '../Modal/AdminEditPriceModal';
import { useAuth } from '../../utils/auth';
import useSWRImmutable from 'swr/immutable';
import useSWR from 'swr';
import { LuAtom } from 'react-icons/lu';

import axios, { AxiosRequestConfig } from 'axios';
import { SaleStatusModalProps } from '../Modal/SaleStatusModal';
import { FaFlag } from 'react-icons/fa';
import { differenceInCalendarDays } from 'date-fns';
import Link from 'next/link';
import HeadingLine from '../Utils/HeadingLine';

import AuctionIcon from '../../public/icons/auction.png';
import ShopIcon from '../../public/icons/shop.svg';
import SWIcon from '../../public/icons/shopwizard.png';
import TPIcon from '../../public/icons/tradingpost.png';

import Image from 'next/image';
import { SeenHistoryModalProps } from '../SeenHistory/SeenHistoryModal';
import { CreatePriceModalModalProps } from '../Modal/CreatePriceModal';

const ChartComponent = dynamic<ChartComponentProps>(() => import('../Charts/PriceChart'));
const LastSeenModal = dynamic<LastSeenModalProps>(() => import('../Modal/LastSeenModal'));
const WrongPriceModal = dynamic<WrongPriceModalProps>(() => import('../Modal/WrongPriceModal'));
const SaleStatusModal = dynamic<SaleStatusModalProps>(() => import('../Modal/SaleStatusModal'));
const CreatePriceModal = dynamic<CreatePriceModalModalProps>(
  () => import('../Modal/CreatePriceModal')
);

const SeenHistoryModal = dynamic<SeenHistoryModalProps>(
  () => import('../SeenHistory/SeenHistoryModal')
);
const AdminEditPriceModal = dynamic<AdminEditPriceModalProps>(
  () => import('../Modal/AdminEditPriceModal')
);

function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  return axios.get(url, config).then((res) => res.data);
}

type Props = {
  item: ItemData;
  prices: PriceData[];
  lastSeen: ItemLastSeen | null;
  lists?: UserList[];
};

const ItemPriceCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const toast = useToast();
  const { user } = useAuth();
  const lastSeenModal = useDisclosure();
  const wrongPriceModal = useDisclosure();
  const saleStatusModal = useDisclosure();
  const adminCreatePrice = useDisclosure();
  const { item } = props;
  const [displayState, setDisplay] = useState('table');
  const isNoTrade = item.status?.toLowerCase() === 'no trade';
  const [selectedPrice, setSelectedPrice] = useState<PriceData | null>(null);
  const [seenHistory, setSeenHistory] = useState<string | null>(null);

  const rgbColor = item.color.rgb;
  const { data: priceStatus, isLoading: isPriceStatusLoading } = useSWRImmutable<PricingInfo>(
    `/api/v1/prices/${item.internal_id}/status`,
    fetcher
  );

  const { data: prices } = useSWR<PriceData[]>(
    `/api/v1/items/${props.item.internal_id}/prices`,
    (url) => fetcher(url),
    { fallbackData: props.prices }
  );

  const { data: lastSeen } = useSWR<ItemLastSeen | null>(
    [
      `/api/v1/prices/stats`,
      {
        params: {
          item_id: props.item.item_id ?? -1,
          name: props.item.name,
          image_id: props.item.image_id,
        },
      },
    ],
    ([url, config]: any) => fetcher(url, config),
    { fallbackData: props.lastSeen }
  );

  const price = prices?.[0].isLatest ? prices[0] : null;

  const priceDiff = useMemo(() => {
    if (!prices || prices.length < 2) return null;
    const priceZero = prices[0].isLatest ? prices[0] : null;
    const priceOne = prices[1];
    if (!priceZero || !priceOne.value) return null;
    return (priceZero.value ?? 0) - priceOne.value;
  }, [prices]);

  useEffect(() => {
    if (displayState === 'chart') window.umami?.track('price-chart');
  }, [displayState]);

  const needHelp = useMemo(() => {
    if (!priceStatus || !user) return false;

    if (priceStatus.dataStatus.fresh >= 10) return false;

    const hasTrades =
      priceStatus.waitingTrades.needPricing + priceStatus.waitingTrades.needVoting >= 5;

    if (!hasTrades) return false;

    const res = {
      needPricing: priceStatus.waitingTrades.needPricing,
      needVoting: priceStatus.waitingTrades.needVoting,
    };

    if (!price) return res;

    if (differenceInCalendarDays(new Date(), new Date(price.addedAt)) > 15 && hasTrades) return res;

    return false;
  }, [user, priceStatus, price]);

  const forceUpdatePrices = async () => {
    if (!user?.isAdmin) return;

    const resultProm = axios.patch(`/api/admin/prices/`, {
      item_iid: item.internal_id,
    });

    toast.promise(resultProm, {
      loading: {
        title: 'Running Price Process Algorithm',
      },
      success: {
        title: 'Algorithm Completed',
        description:
          'Prices may have been updated - if not, please gather more data before trying again',
      },
      error: {
        title: 'An error occurred',
        description: 'Please DO NOT try again.',
      },
    });

    try {
      await resultProm;
    } catch (err) {
      console.error(err);
    }
  };

  if (!prices) return null;

  if (isNoTrade)
    return (
      <CardBase color={rgbColor} title={t('ItemPage.price-overview')}>
        <Center>
          <Icon as={MdMoneyOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
      </CardBase>
    );

  return (
    <>
      {!!selectedPrice && (
        <AdminEditPriceModal
          isOpen={true}
          itemPrice={selectedPrice}
          onClose={() => setSelectedPrice(null)}
          item={item}
        />
      )}
      {adminCreatePrice.isOpen && (
        <CreatePriceModal isOpen={true} onClose={adminCreatePrice.onClose} item={item} />
      )}
      {lastSeenModal.isOpen && (
        <LastSeenModal isOpen={lastSeenModal.isOpen} onClose={lastSeenModal.onClose} />
      )}
      {wrongPriceModal.isOpen && (
        <WrongPriceModal
          item={item}
          data={priceStatus}
          isLoading={isPriceStatusLoading}
          isOpen={wrongPriceModal.isOpen}
          onClose={wrongPriceModal.onClose}
        />
      )}
      {saleStatusModal.isOpen && item.saleStatus && (
        <SaleStatusModal
          item_iid={item.internal_id}
          isOpen={saleStatusModal.isOpen}
          onClose={saleStatusModal.onClose}
          saleStatus={item.saleStatus}
        />
      )}
      {seenHistory && (
        <SeenHistoryModal
          isOpen={!!seenHistory}
          onClose={() => setSeenHistory(null)}
          item={item}
          type={seenHistory as 'tp' | 'auction' | 'restock'}
        />
      )}

      <CardBase color={rgbColor} title={t('ItemPage.price-overview')}>
        <Flex gap={3} flexFlow="column">
          {!!needHelp && <HelpNeeded item={item} helpData={needHelp} />}
          <Flex
            flexFlow={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'inherit', md: 'center' }}
            justifyContent={{ base: 'flex-start', md: 'space-around' }}
            gap={2}
          >
            <Flex flexFlow="column" alignItems={'center'} maxW={{ base: '100%', md: '200px' }}>
              {item.saleStatus && (
                <>
                  {item.saleStatus.status === 'ets' && (
                    <Badge onClick={saleStatusModal.onOpen} colorScheme="green" cursor={'pointer'}>
                      Easy to Sell <Icon verticalAlign={'middle'} boxSize={'14px'} as={MdHelp} />
                    </Badge>
                  )}
                  {item.saleStatus.status === 'hts' && (
                    <Badge onClick={saleStatusModal.onOpen} colorScheme="red" cursor={'pointer'}>
                      Hard to Sell <Icon verticalAlign={'middle'} boxSize={'14px'} as={MdHelp} />
                    </Badge>
                  )}
                  {item.saleStatus.status === 'regular' && (
                    <Badge onClick={saleStatusModal.onOpen} colorScheme="gray" cursor={'pointer'}>
                      Regular <Icon verticalAlign={'middle'} boxSize={'14px'} as={MdHelp} />
                    </Badge>
                  )}
                </>
              )}
              <Stat flex="initial" textAlign="center" minW="20%">
                {price?.inflated && (
                  <Text fontWeight="bold" color="red.300">
                    {t('General.inflation')}
                  </Text>
                )}
                {price?.value && (
                  <StatNumber whiteSpace={'nowrap'}>{format.number(price.value)} NP</StatNumber>
                )}
                {!price?.value && <StatNumber>??? NP</StatNumber>}
                {price?.addedAt && (
                  <StatLabel>
                    {format.dateTime(new Date(price.addedAt), {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </StatLabel>
                )}
                {!price?.addedAt && <StatHelpText>{t('ItemPage.no-info')}</StatHelpText>}
                {priceDiff !== null && (
                  <StatHelpText>
                    {!!priceDiff && <StatArrow type={priceDiff > 0 ? 'increase' : 'decrease'} />}
                    {priceDiff === 0 && <MinusIcon mr={1} boxSize="16px" />}
                    {format.number(priceDiff)} NP
                  </StatHelpText>
                )}
              </Stat>
              {price?.value && (
                <Button
                  size="xs"
                  onClick={wrongPriceModal.onOpen}
                  colorScheme="red"
                  variant={'ghost'}
                  data-umami-event="wrong-price-button"
                >
                  <Icon as={FaFlag} mr={1} verticalAlign={'center'} /> {t('ItemPage.wrong-price')}
                </Button>
              )}
            </Flex>
            <Flex flexFlow="column" width="100%" maxW={'580px'}>
              {prices.length == 0 && (
                <HStack ml="auto" mr={2} mb={2} gap={0}>
                  {user?.isAdmin && (
                    <IconButton
                      onClick={adminCreatePrice.onOpen}
                      size="sm"
                      aria-label="Table"
                      icon={<MdOutlineAdd />}
                      mr={2}
                    />
                  )}
                  {user?.isAdmin && (
                    <IconButton
                      onClick={forceUpdatePrices}
                      size="sm"
                      aria-label="Table"
                      icon={<LuAtom />}
                      mr={2}
                    />
                  )}
                </HStack>
              )}
              {prices.length > 0 && (
                <>
                  <HStack ml="auto" mr={2} mb={2} gap={0}>
                    {user?.isAdmin && (
                      <IconButton
                        onClick={adminCreatePrice.onOpen}
                        size="sm"
                        aria-label="Table"
                        icon={<MdOutlineAdd />}
                        mr={2}
                      />
                    )}
                    {user?.isAdmin && (
                      <IconButton
                        onClick={forceUpdatePrices}
                        size="sm"
                        aria-label="Table"
                        icon={<LuAtom />}
                        mr={2}
                      />
                    )}

                    {displayState === 'table' && (
                      <IconButton
                        onClick={() => setDisplay('chart')}
                        size="sm"
                        aria-label="Chart"
                        icon={<AiOutlineAreaChart />}
                      />
                    )}
                    {displayState === 'chart' && (
                      <IconButton
                        onClick={() => setDisplay('table')}
                        size="sm"
                        aria-label="Table"
                        icon={<AiOutlineTable />}
                      />
                    )}
                  </HStack>
                  {displayState === 'chart' && (
                    <ChartComponent lists={props.lists} color={item.color} data={prices} />
                  )}
                  {displayState === 'table' && (
                    <Box bg="blackAlpha.300" borderRadius={'md'} overflow={'hidden'}>
                      <PriceTable
                        item={item}
                        color={item.color.hex}
                        lists={props.lists}
                        data={prices}
                        isAdmin={user?.isAdmin}
                        onEdit={(price) => setSelectedPrice(price)}
                      />
                    </Box>
                  )}
                </>
              )}
              {prices.length == 0 && (
                <Flex justifyContent="center" alignItems="center" minH={150}>
                  <Text fontSize="xs" color="gray.200" textAlign={'center'}>
                    {t('ItemPage.no-data')} <br />
                    <Button mt={1} size="xs" onClick={wrongPriceModal.onOpen}>
                      {' '}
                      {t('General.learnHelp')}
                    </Button>
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
          <HeadingLine
            fontSize={'sm'}
            fontWeight={'bold'}
            cursor={'pointer'}
            alignItems={'center'}
            onClick={lastSeenModal.onOpen}
          >
            {t('ItemPage.seen-at')} <Icon boxSize={'12px'} as={MdHelp} ml={1} />
          </HeadingLine>

          <HStack
            justifyContent={{ base: 'center', md: 'space-around' }}
            textAlign="center"
            flexWrap={'wrap'}
          >
            <LastSeenCard type="sw" lastSeen={lastSeen?.sw} isLoading={!lastSeen} />
            <LastSeenCard
              type="tp"
              lastSeen={lastSeen?.tp}
              isLoading={!lastSeen}
              onClick={() => setSeenHistory('tp')}
            />
            <LastSeenCard
              type="auction"
              lastSeen={lastSeen?.auction}
              data-umami-event="copy-link"
              isLoading={!lastSeen}
              onClick={() => setSeenHistory('auction')}
            />
            <LastSeenCard
              type="restock"
              lastSeen={lastSeen?.restock}
              isLoading={!lastSeen}
              isAlways={item.findAt.restockShop?.includes('hiddentower')}
              doesNotRestock={!item.findAt.restockShop}
              onClick={() => setSeenHistory('restock')}
            />
          </HStack>
        </Flex>
      </CardBase>
    </>
  );
};

export default ItemPriceCard;

type HelpNeededProps = {
  item: ItemData;
  helpData: { needPricing: number; needVoting: number };
};

const HelpNeeded = (props: HelpNeededProps) => {
  const { item, helpData } = props;
  const [hideHelp, setHideHelp] = useState(false);
  const t = useTranslations();

  if (hideHelp) return null;

  return (
    <Alert status="warning" flexFlow="column" borderRadius={'md'}>
      <AlertIcon />
      <AlertTitle>{t('Feedback.we-need-your-help')}</AlertTitle>
      <AlertDescription
        textAlign={'center'}
        display={'flex'}
        flexFlow="column"
        gap={3}
        fontSize={'sm'}
      >
        {t('Feedback.price-update-txt')}
        <HStack justifyContent={'center'}>
          {!!helpData.needPricing && (
            <Button
              as={Link}
              href={`/feedback/trades?target=${item.name}`}
              prefetch={false}
              target="_blank"
              size="sm"
              data-umami-event="help-needed"
              data-umami-event-label="price-trades"
            >
              {t('Feedback.price-x-trade-lots', {
                x: helpData.needPricing,
              })}
            </Button>
          )}
          {!!helpData.needVoting && (
            <Button
              as={Link}
              href={`/feedback/vote?target=${item.name}`}
              prefetch={false}
              target="_blank"
              size="sm"
              data-umami-event="help-needed"
              data-umami-event-label="vote-suggestions"
            >
              {t('Feedback.vote-x-suggestions', {
                x: helpData.needVoting,
              })}
            </Button>
          )}
        </HStack>
      </AlertDescription>
      <CloseButton
        alignSelf="flex-start"
        position="absolute"
        right={0}
        top={0}
        onClick={() => setHideHelp(true)}
      />
    </Alert>
  );
};

type LastSeenCardProps = {
  type: 'sw' | 'tp' | 'auction' | 'restock';
  lastSeen?: string | null;
  isLoading?: boolean;
  doesNotRestock?: boolean;
  onClick?: () => void;
  isAlways?: boolean;
};

const LastSeenCard = (props: LastSeenCardProps) => {
  const { lastSeen, type, isLoading, doesNotRestock, isAlways, onClick } = props;
  const t = useTranslations();
  const format = useFormatter();

  const track = () => {
    window.umami?.track(`seen-${type}`);
    props.onClick?.();
  };

  const lastSeenTypes = {
    sw: {
      title: t('General.shop-wizard'),
      icon: SWIcon,
    },
    tp: {
      title: t('General.trading-post'),
      icon: TPIcon,
    },
    auction: {
      title: t('General.auction-house'),
      icon: AuctionIcon,
    },
    restock: {
      title: t('General.restock-shop'),
      icon: ShopIcon,
    },
  };

  return (
    <Flex
      flexFlow={'column'}
      fontSize={'sm'}
      bg="gray.700"
      p={2}
      borderRadius={'md'}
      onClick={track}
      cursor={!!onClick && !!lastSeen ? 'pointer' : undefined}
    >
      <Text display={'flex'} alignItems={'center'} gap={1}>
        <Image
          src={lastSeenTypes[type].icon}
          alt={lastSeenTypes[type].title}
          title={lastSeenTypes[type].title}
          height={24}
          quality="100"
          style={{ display: 'inline-block' }}
        />
        {lastSeenTypes[type].title}
      </Text>
      <Text opacity={0.8} suppressHydrationWarning>
        {lastSeen && format.relativeTime(new Date(lastSeen))}
        {!lastSeen && !isLoading && !doesNotRestock && !isAlways && t('General.never')}
        {!lastSeen && !isLoading && !doesNotRestock && isAlways && t('General.always')}
        {isLoading && <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />}
        {type === 'restock' && doesNotRestock && t('ItemPage.does-not-restock')}
      </Text>
    </Flex>
  );
};
