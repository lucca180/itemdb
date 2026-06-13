'use client';

/**
 * NP Price — client shell (item page).
 * Tabs, modals, stat actions, last seen clicks, chart panel.
 */
import dynamic from 'next/dynamic';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  Flex,
  HStack,
  Icon,
  IconButton,
  Skeleton,
  Stat,
  Text,
  Badge,
} from '@chakra-ui/react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { MdHelp, MdOutlineAdd } from 'react-icons/md';
import { LuAtom } from 'react-icons/lu';
import { FaFlag } from 'react-icons/fa';
import { BiEditAlt } from 'react-icons/bi';
import MainLink from '@components/Utils/MainLink';
import HeadingLine from '@components/Utils/HeadingLine';
import { useAuth } from '@utils/auth';
import { useToast } from '@utils/theme/toast';
import { MinusIcon } from '@utils/theme/chakraIcons';
import type { ChartComponentProps } from '@components/Charts/PriceChart';
import type { AdminEditPriceModalProps } from '@components/Modal/AdminEditPriceModal';
import type { LastSeenModalProps } from '@components/Modal/LastSeenModal';
import type { WrongPriceModalProps } from '@components/Modal/WrongPriceModal';
import type { SaleStatusModalProps } from '@components/Modal/SaleStatusModal';
import type { CreatePriceModalModalProps } from '@components/Modal/CreatePriceModal';
import type { SeenHistoryModalProps } from '@components/SeenHistory/SeenHistoryModal';
import type { ItemData, PriceData, PricingInfo, UserList } from '@types';
import type {
  ItemPriceEmptyLabels,
  ItemPriceHelpLabels,
  ItemPriceStatLabels,
  LastSeenCardData,
} from '@app/_components/Item/Price/itemPriceUtils';
import AuctionIcon from '@assets/icons/auction.png';
import ShopIcon from '@assets/icons/shop.svg';
import SWIcon from '@assets/icons/shopwizard.png';
import TPIcon from '@assets/icons/tradingpost.png';

const ChartComponent = dynamic<ChartComponentProps>(() => import('@components/Charts/PriceChart'), {
  ssr: false,
  loading: () => (
    <Flex minH="200px" w="100%" alignItems="center" justifyContent="center">
      <Skeleton height="200px" width="100%" borderRadius="sm" />
    </Flex>
  ),
});
const LastSeenModal = dynamic<LastSeenModalProps>(() => import('@components/Modal/LastSeenModal'), {
  ssr: false,
});
const WrongPriceModal = dynamic<WrongPriceModalProps>(
  () => import('@components/Modal/WrongPriceModal'),
  {
    ssr: false,
  }
);
const SaleStatusModal = dynamic<SaleStatusModalProps>(
  () => import('@components/Modal/SaleStatusModal'),
  {
    ssr: false,
  }
);
const CreatePriceModal = dynamic<CreatePriceModalModalProps>(
  () => import('@components/Modal/CreatePriceModal'),
  {
    ssr: false,
  }
);
const SeenHistoryModal = dynamic<SeenHistoryModalProps>(
  () => import('@components/SeenHistory/SeenHistoryModal'),
  {
    ssr: false,
  }
);
const AdminEditPriceModal = dynamic<AdminEditPriceModalProps>(
  () => import('@components/Modal/AdminEditPriceModal'),
  {
    ssr: false,
  }
);

// --- Tab context ---

export type ItemPriceTab = 'table' | 'chart' | 'seeking' | 'trading';

type ItemPriceTabContextValue = {
  activeTab: ItemPriceTab;
  setActiveTab: (tab: ItemPriceTab) => void;
};

const ItemPriceTabContext = createContext<ItemPriceTabContextValue | null>(null);

export function ItemPriceTabProvider({
  defaultTab = 'table',
  children,
}: {
  defaultTab?: ItemPriceTab;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<ItemPriceTab>(defaultTab);

  useEffect(() => {
    void import('@components/Charts/PriceChart');
  }, []);

  useEffect(() => {
    if (activeTab === 'chart') window.umami?.track('price-chart');
  }, [activeTab]);

  return (
    <ItemPriceTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ItemPriceTabContext.Provider>
  );
}

function useItemPriceTab() {
  const context = useContext(ItemPriceTabContext);
  if (!context) throw new Error('useItemPriceTab must be used within ItemPriceTabProvider');
  return context;
}

const TAB_STYLES: Record<ItemPriceTab, { palette: string; border: string }> = {
  table: { palette: 'green', border: 'green.500' },
  trading: { palette: 'blue', border: 'blue.500' },
  seeking: { palette: 'purple', border: 'purple.500' },
  chart: { palette: 'yellow', border: 'yellow.500' },
};

export function ItemPriceTabBar({
  shouldShowLists,
  labels,
}: {
  shouldShowLists: boolean;
  labels: { table: string; chart: string; trading: string; seeking: string };
}) {
  const { activeTab, setActiveTab } = useItemPriceTab();

  const tabButton = (tab: ItemPriceTab, label: string) => (
    <Button
      colorPalette={activeTab === tab ? TAB_STYLES[tab].palette : ''}
      borderColor={activeTab === tab ? TAB_STYLES[tab].border : 'whiteAlpha.500'}
      data-active={activeTab === tab ? true : undefined}
      onClick={() => setActiveTab(tab)}
      data-umami-event="price-card-buttons"
      data-umami-event-label={tab}
    >
      {label}
    </Button>
  );

  return (
    <Flex mx={'auto'} gap={2} alignItems="center" pb={1.5} mb={1.5} overflow="auto">
      <ButtonGroup size="sm" attached variant="outline" outlineColor="whiteAlpha.300">
        {tabButton('table', labels.table)}
        {shouldShowLists && tabButton('trading', labels.trading)}
        {shouldShowLists && tabButton('seeking', labels.seeking)}
        {tabButton('chart', labels.chart)}
      </ButtonGroup>
    </Flex>
  );
}

export function ItemPricePanel({ tab, children }: { tab: ItemPriceTab; children: ReactNode }) {
  const { activeTab } = useItemPriceTab();
  const hidden = activeTab !== tab;

  return (
    <Flex
      display={hidden ? 'none' : 'flex'}
      flexFlow="column"
      width="100%"
      maxW="580px"
      justifyContent="center"
    >
      {children}
    </Flex>
  );
}

export function ItemPricePanelSkeleton() {
  return (
    <Flex
      direction="column"
      gap={2}
      w="100%"
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      bg="blackAlpha.300"
      borderRadius="sm"
      p={3}
    >
      <Skeleton height="20px" />
      <Skeleton height="20px" />
      <Skeleton height="20px" />
      <Skeleton height="20px" />
    </Flex>
  );
}

// --- Modals + price edit context ---

type ItemPriceModalContextValue = {
  openWrongPrice: () => void;
  openSaleStatus: () => void;
  openLastSeenHelp: () => void;
  openCreatePrice: () => void;
  openSeenHistory: (type: 'tp' | 'auction' | 'restock') => void;
};

const ItemPriceModalContext = createContext<ItemPriceModalContextValue | null>(null);

type PriceEditContextValue = { onEdit: (price: PriceData) => void };
const PriceEditContext = createContext<PriceEditContextValue | null>(null);

function useItemPriceModals() {
  const context = useContext(ItemPriceModalContext);
  if (!context) throw new Error('useItemPriceModals must be used within ItemPriceModalProvider');
  return context;
}

function usePriceEdit() {
  const context = useContext(PriceEditContext);
  if (!context) throw new Error('usePriceEdit must be used within ItemPriceModalProvider');
  return context;
}

export function ItemPriceModalProvider({
  item,
  children,
}: {
  item: ItemData;
  children: ReactNode;
}) {
  const [wrongPriceOpen, setWrongPriceOpen] = useState(false);
  const [saleStatusOpen, setSaleStatusOpen] = useState(false);
  const [lastSeenHelpOpen, setLastSeenHelpOpen] = useState(false);
  const [createPriceOpen, setCreatePriceOpen] = useState(false);
  const [seenHistory, setSeenHistory] = useState<'tp' | 'auction' | 'restock' | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<PriceData | null>(null);
  const [wrongPriceData, setWrongPriceData] = useState<PricingInfo>();
  const [wrongPriceLoading, setWrongPriceLoading] = useState(false);

  const openWrongPrice = () => {
    setWrongPriceOpen(true);
    setWrongPriceLoading(true);

    axios
      .get<PricingInfo>(`/api/v1/prices/${item.internal_id}/status`)
      .then((res) => setWrongPriceData(res.data))
      .catch(console.error)
      .finally(() => setWrongPriceLoading(false));
  };

  return (
    <ItemPriceModalContext.Provider
      value={{
        openWrongPrice,
        openSaleStatus: () => setSaleStatusOpen(true),
        openLastSeenHelp: () => setLastSeenHelpOpen(true),
        openCreatePrice: () => setCreatePriceOpen(true),
        openSeenHistory: setSeenHistory,
      }}
    >
      <PriceEditContext.Provider value={{ onEdit: setSelectedPrice }}>
        {!!selectedPrice && (
          <AdminEditPriceModal
            isOpen
            itemPrice={selectedPrice}
            onClose={() => setSelectedPrice(null)}
            item={item}
          />
        )}
        {wrongPriceOpen && (
          <WrongPriceModal
            item={item}
            data={wrongPriceData}
            isLoading={wrongPriceLoading}
            isOpen={wrongPriceOpen}
            onClose={() => setWrongPriceOpen(false)}
          />
        )}
        {createPriceOpen && (
          <CreatePriceModal
            isOpen={createPriceOpen}
            onClose={() => setCreatePriceOpen(false)}
            item={item}
          />
        )}
        {lastSeenHelpOpen && (
          <LastSeenModal isOpen={lastSeenHelpOpen} onClose={() => setLastSeenHelpOpen(false)} />
        )}
        {saleStatusOpen && item.saleStatus && (
          <SaleStatusModal
            item_iid={item.internal_id}
            isOpen={saleStatusOpen}
            onClose={() => setSaleStatusOpen(false)}
            saleStatus={item.saleStatus}
          />
        )}
        {seenHistory && (
          <SeenHistoryModal
            isOpen
            onClose={() => setSeenHistory(null)}
            item={item}
            type={seenHistory}
          />
        )}
        {children}
      </PriceEditContext.Provider>
    </ItemPriceModalContext.Provider>
  );
}

export function PriceTableEditButton({ price }: { price: PriceData }) {
  const { onEdit } = usePriceEdit();
  return (
    <IconButton
      onClick={() => onEdit(price)}
      size="2xs"
      colorPalette="whiteAlpha"
      variant="subtle"
      aria-label="Edit"
    >
      <BiEditAlt />
    </IconButton>
  );
}

// --- Stat actions ---

export function PriceStatActions({
  item,
  inflated,
  valueText,
  dateLabel,
  showNoInfo,
  hasKnownPrice,
  priceDiff,
  priceDiffLabel,
  labels,
}: {
  item: ItemData;
  inflated?: boolean;
  valueText: string;
  dateLabel?: string;
  showNoInfo?: boolean;
  hasKnownPrice: boolean;
  priceDiff?: number | null;
  priceDiffLabel?: string | null;
  labels: ItemPriceStatLabels;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const { openWrongPrice, openSaleStatus, openCreatePrice } = useItemPriceModals();

  const forceUpdatePrices = async () => {
    if (!user?.isAdmin) return;
    const resultProm = axios.patch('/api/admin/prices/', { item_iid: item.internal_id });
    toast.promise(resultProm, {
      loading: { id: 'force-update-prices-loading', title: 'Running Price Process Algorithm' },
      success: {
        id: 'force-update-prices-success',
        title: 'Algorithm Completed',
        description:
          'Prices may have been updated - if not, please gather more data before trying again',
      },
      error: {
        id: 'force-update-prices-error',
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

  return (
    <Flex flexFlow="column" alignItems="center" maxW={{ base: '100%', md: '200px' }}>
      {item.saleStatus && (
        <>
          {item.saleStatus.status === 'ets' && (
            <Badge onClick={openSaleStatus} colorPalette="green" cursor="pointer" mb={1}>
              Easy to Sell <Icon verticalAlign="middle" boxSize="14px" as={MdHelp} />
            </Badge>
          )}
          {item.saleStatus.status === 'hts' && (
            <Badge onClick={openSaleStatus} colorPalette="red" cursor="pointer" mb={1}>
              Hard to Sell <Icon verticalAlign="middle" boxSize="14px" as={MdHelp} />
            </Badge>
          )}
          {item.saleStatus.status === 'regular' && (
            <Badge onClick={openSaleStatus} colorPalette="gray" cursor="pointer" mb={1}>
              Regular <Icon verticalAlign="middle" boxSize="14px" as={MdHelp} />
            </Badge>
          )}
        </>
      )}
      <Stat.Root
        flex="initial"
        textAlign="center"
        minW="20%"
        alignItems="center"
        justifyContent="center"
      >
        {inflated && (
          <Text fontWeight="bold" color="red.300">
            {labels.inflation}
          </Text>
        )}
        <Stat.ValueText whiteSpace="nowrap">{valueText}</Stat.ValueText>
        {dateLabel && <Stat.Label>{dateLabel}</Stat.Label>}
        {showNoInfo && <Stat.HelpText>{labels.noInfo}</Stat.HelpText>}
        {priceDiffLabel != null && priceDiff !== null && (
          <Stat.HelpText>
            {!!priceDiff && priceDiff > 0 && <Stat.UpIndicator />}
            {!!priceDiff && priceDiff < 0 && <Stat.DownIndicator />}
            {priceDiff === 0 && <MinusIcon mr={1} boxSize="16px" />}
            {priceDiffLabel}
          </Stat.HelpText>
        )}
      </Stat.Root>
      {hasKnownPrice && (
        <Button
          mt={1}
          size="2xs"
          onClick={openWrongPrice}
          colorPalette="red"
          variant="ghost"
          data-umami-event="wrong-price-button"
        >
          <Icon as={FaFlag} mr={1} verticalAlign="center" /> {labels.wrongPrice}
        </Button>
      )}
      <HStack mt={2} gap={2}>
        {user?.isAdmin && (
          <IconButton
            onClick={openCreatePrice}
            size="2xs"
            colorPalette="whiteAlpha"
            variant="subtle"
            aria-label="Add Price"
          >
            <MdOutlineAdd />
          </IconButton>
        )}
        {user?.isAdmin && (
          <IconButton
            onClick={forceUpdatePrices}
            colorPalette="whiteAlpha"
            variant="subtle"
            size="2xs"
            aria-label="Force Update Prices"
          >
            <LuAtom />
          </IconButton>
        )}
      </HStack>
    </Flex>
  );
}

export function PriceStatSkeleton() {
  return (
    <Flex flexFlow="column" alignItems="center" maxW={{ base: '100%', md: '200px' }} gap={2}>
      <Stat.Root textAlign="center" alignItems="center">
        <Skeleton height="24px" width="100px" />
        <Skeleton height="14px" width="80px" mt={2} />
      </Stat.Root>
      <Skeleton height="20px" width="90px" />
    </Flex>
  );
}

// --- Help banner ---

export function HelpNeeded({ item, labels }: { item: ItemData; labels: ItemPriceHelpLabels }) {
  const [hideHelp, setHideHelp] = useState(false);

  useEffect(() => {
    window.umami?.track('need-help-view', { name: item.name });
  }, [item.name]);

  if (hideHelp) return null;

  return (
    <Alert.Root status="warning" flexFlow="column" borderRadius="md">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{labels.title}</Alert.Title>
        <Alert.Description
          textAlign="center"
          display="flex"
          flexFlow="column"
          gap={3}
          fontSize="sm"
        >
          {labels.description}
          <HStack justifyContent="center">
            {labels.priceTradeLots && (
              <Button asChild size="sm">
                <MainLink
                  href={`/feedback/trades?target=${item.name}`}
                  target="_blank"
                  trackEvent="help-needed"
                  trackEventLabel="price-trades"
                >
                  {labels.priceTradeLots}
                </MainLink>
              </Button>
            )}
            {labels.voteSuggestions && (
              <Button asChild size="sm">
                <MainLink
                  href={`/feedback/vote?target=${item.name}`}
                  target="_blank"
                  trackEvent="help-needed"
                  trackEventLabel="vote-suggestions"
                >
                  {labels.voteSuggestions}
                </MainLink>
              </Button>
            )}
          </HStack>
        </Alert.Description>
      </Alert.Content>
      <CloseButton
        alignSelf="flex-start"
        position="absolute"
        right={0}
        top={0}
        onClick={() => setHideHelp(true)}
      />
    </Alert.Root>
  );
}

// --- Empty state ---

export function PriceEmptyPanel({ labels }: { labels: ItemPriceEmptyLabels }) {
  const { openWrongPrice } = useItemPriceModals();

  return (
    <Flex justifyContent="center" alignItems="center" minH={150}>
      <Text fontSize="xs" color="gray.200" textAlign="center">
        {labels.noData} <br />
        <Button mt={1} size="xs" onClick={openWrongPrice}>
          {labels.learnHelp}
        </Button>
      </Text>
    </Flex>
  );
}

// --- Chart panel ---

export function PriceChartPanel({
  item,
  prices,
  lists,
}: {
  item: ItemData;
  prices: PriceData[];
  lists?: UserList[];
}) {
  const { activeTab } = useItemPriceTab();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'chart') setMounted(true);
  }, [activeTab]);

  if (!mounted || !prices.length) return null;

  return (
    <Box minH="200px" w="100%">
      <ChartComponent lists={lists} color={item.color} data={prices} />
    </Box>
  );
}

// --- Last seen ---

const SEEN_ICONS: Record<LastSeenCardData['type'], typeof SWIcon> = {
  sw: SWIcon,
  tp: TPIcon,
  auction: AuctionIcon,
  restock: ShopIcon,
};

function LastSeenCard({ card }: { card: LastSeenCardData }) {
  const { openSeenHistory } = useItemPriceModals();
  const { type, title, subtitle, canOpenModal } = card;
  const isLoading = subtitle === undefined;

  const track = () => {
    if (isLoading) return;
    window.umami?.track(`seen-${type}`);
    if (canOpenModal) openSeenHistory(type as 'tp' | 'auction' | 'restock');
  };

  const icon = SEEN_ICONS[type];

  return (
    <Flex
      flexFlow="column"
      fontSize="sm"
      bg="gray.700"
      p={2}
      borderRadius="md"
      onClick={track}
      cursor={!isLoading && canOpenModal ? 'pointer' : 'not-allowed'}
    >
      <Text display="flex" alignItems="center" gap={1}>
        <Image
          src={icon}
          alt={title}
          title={title}
          height={24}
          quality={100}
          style={{ display: 'inline-block' }}
        />
        {title}
      </Text>
      <Box opacity={0.8} minH="1.25rem" fontSize="sm">
        {isLoading ? <Skeleton height="12px" width="60px" /> : subtitle}
      </Box>
    </Flex>
  );
}

export function LastSeenHelpHeading({ label }: { label: string }) {
  const { openLastSeenHelp } = useItemPriceModals();
  return (
    <HeadingLine
      fontSize="sm"
      fontWeight="bold"
      cursor="pointer"
      alignItems="center"
      onClick={openLastSeenHelp}
    >
      {label} <Icon boxSize="12px" as={MdHelp} ml={1} />
    </HeadingLine>
  );
}

export function LastSeenCards({ cards }: { cards: LastSeenCardData[] }) {
  return (
    <HStack
      justifyContent={{ base: 'center', md: 'space-around' }}
      textAlign="center"
      flexWrap="wrap"
    >
      {cards.map((card) => (
        <LastSeenCard key={card.type} card={card} />
      ))}
    </HStack>
  );
}
