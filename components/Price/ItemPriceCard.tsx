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
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ItemData, ItemLastSeen, PriceData, PricingInfo } from '../../types';
import { ChartComponentProps } from '../Charts/PriceChart';
import { AiOutlineAreaChart, AiOutlineTable } from 'react-icons/ai';
import PriceTable from './PriceTable';
import { MinusIcon } from '@chakra-ui/icons';
import CardBase from '../Card/CardBase';
import { MdHelp, MdMoneyOff } from 'react-icons/md';
import dynamic from 'next/dynamic';
import { LastSeenModalProps } from '../Modal/LastSeenModal';
import { useFormatter, useTranslations } from 'next-intl';
import { WrongPriceModalProps } from '../Modal/WrongPriceModal';
import { AdminEditPriceModalProps } from '../Modal/AdminEditPriceModal';
import { useAuth } from '../../utils/auth';
import useSWRImmutable from 'swr';
import axios, { AxiosRequestConfig } from 'axios';
import { SaleStatusModalProps } from '../Modal/SaleStatusModal';
import { FaFlag } from 'react-icons/fa';
import { differenceInCalendarDays } from 'date-fns';
import Link from 'next/link';

const ChartComponent = dynamic<ChartComponentProps>(() => import('../Charts/PriceChart'));
const LastSeenModal = dynamic<LastSeenModalProps>(() => import('../Modal/LastSeenModal'));
const WrongPriceModal = dynamic<WrongPriceModalProps>(() => import('../Modal/WrongPriceModal'));
const SaleStatusModal = dynamic<SaleStatusModalProps>(() => import('../Modal/SaleStatusModal'));

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
};

const intl = new Intl.NumberFormat();

const ItemPriceCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { user } = useAuth();
  const lastSeenModal = useDisclosure();
  const wrongPriceModal = useDisclosure();
  const saleStatusModal = useDisclosure();
  const { item } = props;
  const [displayState, setDisplay] = useState('table');
  const [priceDiff, setDiff] = useState<number | null>(null);
  const isNoTrade = item.status?.toLowerCase() === 'no trade';
  const [selectedPrice, setSelectedPrice] = useState<PriceData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const rgbColor = item.color.rgb;
  const { data: priceStatus, isLoading: isPriceStatusLoading } = useSWRImmutable<PricingInfo>(
    `/api/v1/prices/${item.internal_id}/status`,
    fetcher
  );

  const { data: prices } = useSWRImmutable<PriceData[]>(
    `/api/v1/items/${props.item.internal_id}/prices`,
    (url) => fetcher(url),
    { fallbackData: props.prices }
  );

  const { data: lastSeen } = useSWRImmutable<ItemLastSeen | null>(
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

  const price = prices?.[0];

  useEffect(() => {
    if (!prices) return;
    if (prices.length >= 2) {
      const diff = (prices[0]?.value ?? 0) - (prices[1]?.value ?? 0);
      setDiff(diff);
    } else setDiff(null);
  }, [prices]);

  useEffect(() => {
    if (user && user.isAdmin) setIsAdmin(true);
    else setIsAdmin(false);
  }, [user]);

  const needHelp = useMemo(() => {
    if (!priceStatus || !user) return false;

    if (priceStatus.dataStatus.fresh >= 10) return false;

    const hasTrades =
      priceStatus.waitingTrades.needPricing + priceStatus.waitingTrades.needVoting >= 5;

    if (!hasTrades) return false;

    if (!price) return true;

    if (differenceInCalendarDays(new Date(), new Date(price.addedAt)) > 15 && hasTrades)
      return true;

    return false;
  }, [user, priceStatus, price]);

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
      <CardBase color={rgbColor} title={t('ItemPage.price-overview')}>
        <Flex gap={3} flexFlow="column">
          {needHelp && <HelpNeeded item={item} />}
          <Flex
            flexFlow={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'inherit', md: 'center' }}
            gap={1}
          >
            <Flex flexFlow="column" alignItems={'center'}>
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
                {price?.value && <StatNumber>{intl.format(price.value)} NP</StatNumber>}
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
                    {intl.format(priceDiff)} NP
                  </StatHelpText>
                )}
              </Stat>
              {price?.value && (
                <Button
                  size="xs"
                  onClick={wrongPriceModal.onOpen}
                  colorScheme="red"
                  variant={'ghost'}
                >
                  <Icon as={FaFlag} mr={1} verticalAlign={'center'} /> {t('ItemPage.wrong-price')}
                </Button>
              )}
            </Flex>
            <Flex flexFlow="column" flex="1">
              {prices.length > 0 && (
                <>
                  <HStack ml="auto" mr={2} mb={2} gap={0}>
                    aaa
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
                  {displayState === 'chart' && <ChartComponent color={item.color} data={prices} />}
                  {displayState === 'table' && (
                    <PriceTable
                      data={prices}
                      isAdmin={isAdmin}
                      onEdit={(data) => setSelectedPrice(data)}
                    />
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
          {!!lastSeen && (
            <HStack
              justifyContent={{ base: 'space-between', md: 'space-around' }}
              textAlign="center"
            >
              <Stat flex="initial">
                <StatLabel cursor={'pointer'} onClick={lastSeenModal.onOpen}>
                  {t('ItemPage.last-sw')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  {lastSeen.sw && format.relativeTime(new Date(lastSeen.sw))}
                  {!lastSeen.sw && t('General.never')}
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel cursor={'pointer'} onClick={lastSeenModal.onOpen}>
                  {t('ItemPage.last-tp')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  {lastSeen.tp && format.relativeTime(new Date(lastSeen.tp))}
                  {!lastSeen.tp && t('General.never')}
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel cursor={'pointer'} onClick={lastSeenModal.onOpen}>
                  {t('ItemPage.last-auction')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  {lastSeen.auction && format.relativeTime(new Date(lastSeen.auction))}
                  {!lastSeen.auction && t('General.never')}
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel cursor={'pointer'} onClick={lastSeenModal.onOpen}>
                  {t('ItemPage.last-restock')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  {!lastSeen.restock && !item.findAt.restockShop && t('ItemPage.does-not-restock')}
                  {lastSeen.restock && format.relativeTime(new Date(lastSeen.restock))}
                  {!lastSeen.restock && item.findAt.restockShop && t('General.never')}
                </StatHelpText>
              </Stat>
            </HStack>
          )}
          {!lastSeen && (
            <HStack
              justifyContent={{ base: 'space-between', md: 'space-around' }}
              textAlign="center"
            >
              <Stat flex="initial">
                <StatLabel>
                  {t('ItemPage.last-sw')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>
                  {t('ItemPage.last-tp')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>
                  {t('ItemPage.last-auction')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>
                  {t('ItemPage.last-restock')} <Icon boxSize={'12px'} as={MdHelp} />
                </StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
            </HStack>
          )}
        </Flex>
      </CardBase>
    </>
  );
};

export default ItemPriceCard;

type HelpNeededProps = {
  item: ItemData;
};

const HelpNeeded = (props: HelpNeededProps) => {
  const { item } = props;
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
          <Button
            as={Link}
            href={`/feedback/trades?target=${item.name}`}
            prefetch={false}
            target="_blank"
            size="sm"
          >
            {t('Feedback.price-trade-lots')}
          </Button>
          <Button
            as={Link}
            href={`/feedback/vote?target=${item.name}`}
            prefetch={false}
            target="_blank"
            size="sm"
          >
            {t('Feedback.vote-suggestions')}
          </Button>
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
