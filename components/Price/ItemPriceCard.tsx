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
  Link,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ItemData, ItemLastSeen, PriceData } from '../../types';
import { ChartComponentProps } from '../Charts/PriceChart';
import { AiOutlineAreaChart, AiOutlineTable } from 'react-icons/ai';
import PriceTable from './PriceTable';
import { MinusIcon } from '@chakra-ui/icons';
import CardBase from '../Card/CardBase';
import { MdHelp, MdMoneyOff } from 'react-icons/md';
import dynamic from 'next/dynamic';
import { LastSeenModalProps } from '../Modal/LastSeenModal';
import NextLink from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

const ChartComponent = dynamic<ChartComponentProps>(() => import('../Charts/PriceChart'));
const LastSeenModal = dynamic<LastSeenModalProps>(() => import('../Modal/LastSeenModal'));

type Props = {
  item: ItemData;
  prices: PriceData[];
  lastSeen: ItemLastSeen | null;
  isLoading?: boolean;
};

const intl = new Intl.NumberFormat();

const ItemPriceCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { item, prices, lastSeen, isLoading } = props;
  const [displayState, setDisplay] = useState('table');
  const [priceDiff, setDiff] = useState<number | null>(null);
  const isNoTrade = item.status?.toLowerCase() === 'no trade';

  const color = item.color.rgb;
  const price = prices[0];

  useEffect(() => {
    if (prices.length >= 2) {
      const diff = (prices[0]?.value ?? 0) - (prices[1]?.value ?? 0);
      setDiff(diff);
    } else setDiff(null);
  }, [prices]);

  if (isLoading)
    return (
      <CardBase color={color} title={t('ItemPage.price-overview')}>
        <Flex gap={4} flexFlow="column">
          <Flex gap={3} flexFlow="column">
            <Flex
              flexFlow={{ base: 'column', md: 'row' }}
              alignItems={{ base: 'inherit', md: 'center' }}
            >
              <Stat flex="initial" textAlign="center" minW="20%">
                <StatNumber>
                  <SkeletonText skeletonHeight="5" noOfLines={1} />
                </StatNumber>
                <StatLabel>
                  <SkeletonText mt={3} skeletonHeight="3" noOfLines={1} />
                </StatLabel>
              </Stat>
              <Flex flexFlow="column" flex="1">
                <Flex justifyContent="center" alignItems="center" minH={150}>
                  <SkeletonText skeletonHeight="3" noOfLines={1} w="50%" />
                </Flex>
              </Flex>
            </Flex>
            <HStack
              justifyContent={{ base: 'space-between', md: 'space-around' }}
              textAlign="center"
            >
              <Stat flex="initial">
                <StatLabel>{t('ItemPage.last-sw')}</StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>{t('ItemPage.last-tp')}</StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>{t('ItemPage.last-auction')}</StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
              <Stat flex="initial">
                <StatLabel>{t('ItemPage.last-restock')}</StatLabel>
                <StatHelpText>
                  <SkeletonText mt={1} skeletonHeight="3" noOfLines={1} />
                </StatHelpText>
              </Stat>
            </HStack>
          </Flex>
        </Flex>
      </CardBase>
    );

  if (isNoTrade)
    return (
      <CardBase color={color} title={t('ItemPage.price-overview')}>
        <Center>
          <Icon as={MdMoneyOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
      </CardBase>
    );

  return (
    <>
      <LastSeenModal isOpen={isOpen} onClose={onClose} />
      <CardBase color={color} title={t('ItemPage.price-overview')}>
        <Flex gap={4} flexFlow="column">
          <Flex gap={3} flexFlow="column">
            <Flex
              flexFlow={{ base: 'column', md: 'row' }}
              alignItems={{ base: 'inherit', md: 'center' }}
              gap={1}
            >
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
              <Flex flexFlow="column" flex="1">
                {prices.length > 0 && (
                  <>
                    <HStack ml="auto" mr={2} mb={2} gap={0}>
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
                      <ChartComponent color={item.color} data={prices} />
                    )}
                    {displayState === 'table' && <PriceTable data={prices} />}
                  </>
                )}
                {prices.length == 0 && (
                  <Flex justifyContent="center" alignItems="center" minH={150}>
                    <Text fontSize="xs" color="gray.200" textAlign={'center'}>
                      {t('ItemPage.no-data')} <br />
                      <Link as={NextLink} href="/contribute" color="gray.400">
                        {t('General.learnHelp')}
                      </Link>
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
            {lastSeen !== null && (
              <HStack
                justifyContent={{ base: 'space-between', md: 'space-around' }}
                textAlign="center"
              >
                <Stat flex="initial">
                  <StatLabel cursor={'pointer'} onClick={onOpen}>
                    {t('ItemPage.last-sw')} <Icon boxSize={'12px'} as={MdHelp} />
                  </StatLabel>
                  <StatHelpText>
                    {lastSeen.sw && format.relativeTime(new Date(lastSeen.sw))}
                    {!lastSeen.sw && t('General.never')}
                  </StatHelpText>
                </Stat>
                <Stat flex="initial">
                  <StatLabel cursor={'pointer'} onClick={onOpen}>
                    {t('ItemPage.last-tp')} <Icon boxSize={'12px'} as={MdHelp} />
                  </StatLabel>
                  <StatHelpText>
                    {lastSeen.tp && format.relativeTime(new Date(lastSeen.tp))}
                    {!lastSeen.tp && t('General.never')}
                  </StatHelpText>
                </Stat>
                <Stat flex="initial">
                  <StatLabel cursor={'pointer'} onClick={onOpen}>
                    {t('ItemPage.last-auction')} <Icon boxSize={'12px'} as={MdHelp} />
                  </StatLabel>
                  <StatHelpText>
                    {lastSeen.auction && format.relativeTime(new Date(lastSeen.auction))}
                    {!lastSeen.auction && t('General.never')}
                  </StatHelpText>
                </Stat>
                <Stat flex="initial">
                  <StatLabel cursor={'pointer'} onClick={onOpen}>
                    {t('ItemPage.last-restock')} <Icon boxSize={'12px'} as={MdHelp} />
                  </StatLabel>
                  <StatHelpText>
                    {!lastSeen.restock &&
                      !item.findAt.restockShop &&
                      t('ItemPage.does-not-restock')}
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
        </Flex>
      </CardBase>
    </>
  );
};

export default ItemPriceCard;
