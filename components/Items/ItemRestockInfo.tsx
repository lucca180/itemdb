import { Center, Flex, HStack, Tag, Text, Link, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemLastSeen } from '../../types';
import {
  categoryToShopID,
  faerielandShops,
  getDateNST,
  getRestockPrice,
  getRestockProfit,
  halloweenShops,
  isThirdWednesday,
  nextThirdWednesday,
  restockShopInfo,
  slugify,
  tyrannianShops,
} from '../../utils/utils';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import NextLink from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { MdHelp } from 'react-icons/md';

type Props = {
  item: ItemData;
  lastSeen: ItemLastSeen | null;
  isHT?: boolean; // is hidden tower item
};

const ItemRestock = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, lastSeen, isHT } = props;
  const [specialDay, setSpecialDay] = React.useState('');

  React.useEffect(() => {
    if (!item.category) return;
    const todayNST = getDateNST();

    if (isHT) {
      //check if is the third wednesday of the month
      if (isThirdWednesday()) setSpecialDay('ht');
      return;
    }

    if (todayNST.getDate() === 3) setSpecialDay('hpd');
    else if (
      todayNST.getMonth() === 4 &&
      todayNST.getDate() === 12 &&
      tyrannianShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('tyrannia');

    if (
      todayNST.getMonth() === 7 &&
      todayNST.getDate() === 20 &&
      item.category.toLowerCase() === 'usuki doll'
    )
      setSpecialDay('usukicon');

    if (
      todayNST.getMonth() === 8 &&
      todayNST.getDate() === 20 &&
      faerielandShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('festival');

    if (
      todayNST.getMonth() === 9 &&
      todayNST.getDate() === 31 &&
      halloweenShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('halloween');
  }, []);

  const restockPrice = getRestockPrice(item);
  const originalRestockPrice = getRestockPrice(item, true);
  const restockProfit = getRestockProfit(item);
  const restockOriginalProfit = getRestockProfit(item, true);

  const shopInfo = item.category
    ? restockShopInfo[isHT ? '-3' : categoryToShopID[item.category.toLowerCase()]]
    : null;
  if (!item.category || !item.estVal || !restockPrice) return null;

  return (
    <CardBase title={t('Restock.restock-info')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link
            as={NextLink}
            href={
              !isHT ? `/restock/${slugify(shopInfo?.name ?? '')}` : '/lists/official/hidden-tower'
            }
          >
            <Image
              src={
                !isHT
                  ? `https://images.neopets.com/shopkeepers/w${
                      categoryToShopID[item.category.toLowerCase()]
                    }.gif`
                  : 'https://images.neopets.com/faerieland/tower_1.gif'
              }
              priority
              alt={item.category.toLowerCase() + ' shop'}
              width={276}
              height={92}
            />
          </Link>
          {specialDay === 'hpd' && <Tag colorScheme={'green'}>{t('Restock.half-price-day')}</Tag>}
          {specialDay === 'tyrannia' && (
            <Tag colorScheme={'orange'}>{t('Restock.tyrannian-victory-day')}</Tag>
          )}
          {specialDay === 'usukicon' && <Tag colorScheme={'pink'}>{t('Restock.usuki-day')}</Tag>}
          {specialDay === 'festival' && (
            <Tag colorScheme={'purple'}>{t('Restock.faerie-festival')}</Tag>
          )}
          {specialDay === 'halloween' && <Tag colorScheme={'orange'}>{t('Restock.halloween')}</Tag>}
          {specialDay === 'ht' && <Tag colorScheme={'pink'}>{t('Restock.hidden-tower')}</Tag>}
        </Center>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            {t('Restock.est-profit')}
          </Tag>
          <Flex flexFlow={'column'} flex="1">
            <Text
              flex="1"
              fontSize="xs"
              textAlign="right"
              color={
                restockProfit && restockProfit <= 0
                  ? 'red.300'
                  : specialDay
                  ? 'green.200'
                  : undefined
              }
            >
              {!restockProfit && '???'}
              {restockProfit && <>{format.number(restockProfit)} NP</>}
            </Text>
            {!!specialDay && restockOriginalProfit && (
              <Text fontSize="xs" textAlign="right" textDecoration={'line-through'}>
                {format.number(restockOriginalProfit)} NP{' '}
              </Text>
            )}
          </Flex>
        </HStack>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            {t('Restock.restock-price')}
          </Tag>
          <Flex flexFlow={'column'} flex="1">
            <Text fontSize="xs" textAlign="right" color={specialDay ? 'green.200' : undefined}>
              {format.number(restockPrice[0])} NP{' '}
              {restockPrice[0] !== restockPrice[1] ? `- ${format.number(restockPrice[1])} NP` : ''}
            </Text>
            {!!specialDay && originalRestockPrice && (
              <Text fontSize="xs" textAlign="right" textDecoration={'line-through'}>
                {format.number(originalRestockPrice[0])} NP{' '}
                {originalRestockPrice[0] !== originalRestockPrice[1]
                  ? `- ${format.number(originalRestockPrice[1])} NP`
                  : ''}
              </Text>
            )}
          </Flex>
        </HStack>
        {!isHT && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('Restock.latest-restock')}
            </Tag>
            <Text flex="1" fontSize="xs" textAlign="right">
              {lastSeen?.restock && (
                <>
                  {new Date(lastSeen?.restock).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </>
              )}
              {!lastSeen?.restock && '???'}
            </Text>
          </HStack>
        )}
        {isHT && (
          <HStack>
            <Tooltip
              hasArrow
              label={t('Restock.ht-next-discount-day', {
                x: nextThirdWednesday().toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }),
              })}
            >
              <Tag size="md" fontWeight="bold" as="h3">
                {t('Restock.discounted-price')}{' '}
                <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
              </Tag>
            </Tooltip>
            <Text flex="1" fontSize="xs" textAlign="right">
              {format.number(Math.round(item.estVal * 0.97))} NP
            </Text>
          </HStack>
        )}
        {isHT && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('Restock.random-event-price')}
            </Tag>
            <Text flex="1" fontSize="xs" textAlign="right">
              {format.number(Math.round(item.estVal * 0.9))} NP
            </Text>
          </HStack>
        )}
      </Flex>
    </CardBase>
  );
};

export default ItemRestock;
