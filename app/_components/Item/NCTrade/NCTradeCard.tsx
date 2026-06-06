'use client';

/**
 * NC Trade — client shell (item page).
 *
 * Tab chrome and NC value badge render immediately. Insights are preloaded on the
 * page loader; seeking panel blocks via Suspense in NCTradeSection.
 */
import {
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  Link,
  Skeleton,
  Stat,
  Text,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { TbGiftOff } from 'react-icons/tb';
import { ItemData, UserList } from '@types';
import CardBase from '@components/Card/CardBase';
import MainLink from '@components/Utils/MainLink';
import { useTranslations } from 'next-intl';
import {
  filterSeekingLists,
  filterTradingLists,
} from '@app/_components/Item/NCTrade/ncTradeListFilters';

export type NCTradeTab = 'seeking' | 'trading' | 'insights' | 'ncTrading';

/** Placeholder while deferred tab panels stream in. */
export function NCTradePanelSkeleton() {
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

type NCTradeCardProps = {
  item: ItemData;
  lists?: UserList[];
  isNoTrade?: boolean;
  hasInsights?: boolean;
  defaultTab?: NCTradeTab;
  insightsPanel?: ReactNode;
  seekingPanel?: ReactNode;
  tradingTab?: ReactNode;
  historyTab?: ReactNode;
  owlsTabLabel?: ReactNode;
};

export function NCTradeCard({
  item,
  lists,
  isNoTrade = false,
  hasInsights = false,
  defaultTab = 'seeking',
  insightsPanel,
  seekingPanel,
  tradingTab,
  historyTab,
  owlsTabLabel,
}: NCTradeCardProps) {
  const t = useTranslations();
  const color = item.color.rgb;

  const seeking = filterSeekingLists(lists);
  const trading = filterTradingLists(lists);

  const [activeTab, setActiveTab] = useState<NCTradeTab>(defaultTab);

  const panel =
    activeTab === 'insights'
      ? insightsPanel
      : activeTab === 'seeking'
        ? seekingPanel
        : activeTab === 'trading'
          ? tradingTab
          : historyTab;

  return (
    <CardBase title={t('ItemPage.nc-trade')} color={color}>
      <Flex flexFlow="column" minH={isNoTrade ? 'auto' : '200px'}>
        {!isNoTrade && (
          <Flex
            justifyContent={{ base: 'flex-start', md: 'center' }}
            gap={2}
            alignItems="center"
            pb={1.5}
            mb={1.5}
            overflow="auto"
          >
            <ButtonGroup size="sm" attached variant="outline">
              {hasInsights && (
                <Button
                  colorPalette={activeTab === 'insights' ? 'blue' : ''}
                  borderColor={activeTab === 'insights' ? undefined : 'whiteAlpha.800'}
                  data-active={activeTab === 'insights' ? true : undefined}
                  onClick={() => setActiveTab('insights')}
                  data-umami-event="nc-trade-buttons"
                  data-umami-event-label="insights"
                >
                  {t('ItemPage.insights')}
                </Button>
              )}
              <Button
                colorPalette={activeTab === 'seeking' ? 'cyan' : ''}
                borderColor={activeTab === 'seeking' ? undefined : 'whiteAlpha.800'}
                data-active={activeTab === 'seeking' ? true : undefined}
                onClick={() => setActiveTab('seeking')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label="seeking"
              >
                {seeking.length} {t('ItemPage.seeking')}
              </Button>
              <Button
                colorPalette={activeTab === 'trading' ? 'purple' : ''}
                borderColor={activeTab === 'trading' ? undefined : 'whiteAlpha.800'}
                data-active={activeTab === 'trading' ? true : undefined}
                onClick={() => setActiveTab('trading')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label="trading"
              >
                {trading.length} {t('ItemPage.trading')}
              </Button>
              <Button
                colorPalette={activeTab === 'ncTrading' ? 'yellow' : ''}
                borderColor={activeTab === 'ncTrading' ? undefined : 'whiteAlpha.800'}
                data-active={activeTab === 'ncTrading' ? true : undefined}
                onClick={() => setActiveTab('ncTrading')}
                data-umami-event="nc-trade-buttons"
                data-umami-event-label="owls-trading"
              >
                {owlsTabLabel ?? t('ItemPage.owls-trades')}
              </Button>
            </ButtonGroup>
          </Flex>
        )}
        <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
          {!isNoTrade && (
            <Badge
              colorPalette={item.ncValue && item.ncValue.source === 'lebron' ? 'yellow' : 'purple'}
              fontSize="xs"
              minW="15%"
              maxW={{ base: '100%', md: '25%' }}
              whiteSpace="normal"
              textTransform="initial"
              alignSelf="center"
              borderRadius="md"
              textAlign="center"
            >
              <Stat.Root flex="initial" justifyContent="center" alignItems="center" w="full">
                <Stat.Label fontSize="xs">
                  {!item.ncValue && t('ItemPage.nc-guide-value')}
                  {item.ncValue?.source === 'itemdb' && t('ItemPage.itemdb-value')}
                  {item.ncValue?.source === 'lebron' && (
                    <Link asChild target="_blank" rel="noreferrer">
                      <MainLink href="/articles/lebron" target="_blank">
                        {t('ItemPage.lebron-value')}
                      </MainLink>
                    </Link>
                  )}
                </Stat.Label>
                {!item.ncValue && (
                  <>
                    <Stat.ValueText mb={0}>???</Stat.ValueText>
                    <Text fontSize="xs" as="span">
                      {t('ItemPage.no-enough-data')}
                    </Text>
                    <Stat.HelpText fontSize="xs" mt={1} mb={0} fontWeight="medium" opacity={1}>
                      <Link asChild target="_blank" rel="noreferrer">
                        <MainLink href="/mall/report" target="_blank">
                          {t('ItemPage.report-your-nc-trades')}
                        </MainLink>
                      </Link>
                    </Stat.HelpText>
                  </>
                )}
                {item.ncValue && (
                  <>
                    <Stat.ValueText mb={0}>
                      {item.ncValue.range}
                      <Text fontSize="xs" as="span">
                        {' '}
                        caps
                      </Text>
                    </Stat.ValueText>
                    <Stat.HelpText fontSize="xs" mb={0} color="yellow.200">
                      {format(new Date(item.ncValue.addedAt), 'PP')}{' '}
                    </Stat.HelpText>
                  </>
                )}
              </Stat.Root>
            </Badge>
          )}
          {isNoTrade && (
            <Badge
              colorPalette="gray"
              fontSize="xs"
              minW="15%"
              maxW={{ base: '100%', md: '25%' }}
              whiteSpace="normal"
              textTransform="initial"
              alignSelf="center"
              borderRadius="md"
            >
              <Stat.Root
                flex="initial"
                justifyContent="center"
                alignItems="center"
                w="full"
                textAlign="center"
              >
                <Stat.Label>
                  <Icon mt={2} boxSize="24px" as={TbGiftOff} />
                </Stat.Label>
                <Stat.ValueText mb={1}>{t('ItemPage.no-trade')}</Stat.ValueText>
                <Stat.HelpText fontSize="xs" mt={0} fontWeight="medium">
                  {t('ItemPage.no-trade-help-text')}
                </Stat.HelpText>
              </Stat.Root>
            </Badge>
          )}
          <Flex flexFlow="column" flex="1" overflow="hidden">
            {activeTab === 'insights' ? (
              panel
            ) : (
              <Flex justifyContent="center" alignItems="center" gap={3} w="100%">
                {panel}
              </Flex>
            )}
          </Flex>
        </Flex>
        {!isNoTrade && (
          <Text
            fontSize="xs"
            textAlign="center"
            justifySelf="flex-end"
            color="whiteAlpha.600"
            mt={1}
          >
            {t.rich('ItemPage.report-owls-cta', {
              Link: (chunk) => (
                <Link asChild color="whiteAlpha.800">
                  <MainLink href="/mall/report?utm_content=owls-cta">{chunk}</MainLink>
                </Link>
              ),
            })}
          </Text>
        )}
      </Flex>
    </CardBase>
  );
}

export default NCTradeCard;
