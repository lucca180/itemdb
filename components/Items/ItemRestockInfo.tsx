import { Center, Flex, HStack, Tag, Text, Link } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemLastSeen } from '../../types';
import {
  categoryToShopID,
  faerielandShops,
  getRestockPrice,
  getRestockProfit,
  halloweenShops,
  restockShopInfo,
  slugify,
  tyrannianShops,
} from '../../utils/utils';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  lastSeen: ItemLastSeen | null;
};

const intl = new Intl.NumberFormat();

const ItemRestock = (props: Props) => {
  const t = useTranslations();
  const { item, lastSeen } = props;
  const [specialDay, setSpecialDay] = React.useState('');

  React.useEffect(() => {
    if (!item.category) return;
    const todayNST = new Date();

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
    ? restockShopInfo[categoryToShopID[item.category.toLowerCase()]]
    : null;
  if (!item.category || !item.estVal || !restockPrice) return null;

  return (
    <CardBase title={t('Restock.restock-info')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link as={NextLink} href={`/restock/${slugify(shopInfo?.name ?? '')}`}>
            <Image
              src={`https://images.neopets.com/shopkeepers/w${
                categoryToShopID[item.category.toLowerCase()]
              }.gif`}
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
              {restockProfit && <>{intl.format(restockProfit)} NP</>}
            </Text>
            {!!specialDay && restockOriginalProfit && (
              <Text fontSize="xs" textAlign="right" textDecoration={'line-through'}>
                {intl.format(restockOriginalProfit)} NP{' '}
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
              {intl.format(restockPrice[0])} NP{' '}
              {restockPrice[0] !== restockPrice[1] ? `- ${intl.format(restockPrice[1])} NP` : ''}
            </Text>
            {!!specialDay && originalRestockPrice && (
              <Text fontSize="xs" textAlign="right" textDecoration={'line-through'}>
                {intl.format(originalRestockPrice[0])} NP{' '}
                {originalRestockPrice[0] !== originalRestockPrice[1]
                  ? `- ${intl.format(originalRestockPrice[1])} NP`
                  : ''}
              </Text>
            )}
          </Flex>
        </HStack>
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
      </Flex>
    </CardBase>
  );
};

export default ItemRestock;
