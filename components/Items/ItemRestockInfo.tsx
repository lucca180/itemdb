import { Center, Flex, HStack, Tag, Text, Link } from '@chakra-ui/react';
import { MdHelp } from 'react-icons/md';
import Tooltip from '@components/Utils/Tooltip';
import { ItemData, ItemLastSeen } from '@types';
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
} from '@utils/utils';
import CardBase from '@components/Card/CardBase';
import Image from 'next/image';
import { Link as I18nLink } from '@i18n/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

type Props = {
  item: ItemData;
  lastSeen: ItemLastSeen | null;
};

export default async function ItemRestock(props: Props) {
  const t = await getTranslations();
  const format = await getFormatter();
  const { item, lastSeen } = props;

  const isHT = item.findAt.restockShop?.includes('hiddentower938');
  const todayNST = getDateNST();
  const specialDay = getRestockSpecialDay(item, isHT, todayNST);

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
          <Link asChild _hover={{ textDecoration: 'none' }}>
            <I18nLink
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
            </I18nLink>
          </Link>
          {specialDay === 'hpd' && (
            <Tag.Root colorPalette={'green'}>
              <Tag.Label>{t('Restock.half-price-day')}</Tag.Label>
            </Tag.Root>
          )}
          {specialDay === 'tyrannia' && (
            <Tag.Root colorPalette={'orange'}>
              <Tag.Label>{t('Restock.tyrannian-victory-day')}</Tag.Label>
            </Tag.Root>
          )}
          {specialDay === 'usukicon' && (
            <Tag.Root colorPalette={'pink'}>
              <Tag.Label>{t('Restock.usuki-day')}</Tag.Label>
            </Tag.Root>
          )}
          {specialDay === 'festival' && (
            <Tag.Root colorPalette={'purple'}>
              <Tag.Label>{t('Restock.faerie-festival')}</Tag.Label>
            </Tag.Root>
          )}
          {specialDay === 'halloween' && (
            <Tag.Root colorPalette={'orange'}>
              <Tag.Label>{t('Restock.halloween')}</Tag.Label>
            </Tag.Root>
          )}
          {specialDay === 'ht' && (
            <Tag.Root colorPalette={'pink'}>
              <Tag.Label>{t('Restock.hidden-tower')}</Tag.Label>
            </Tag.Root>
          )}
        </Center>
        <HStack>
          <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette={'whiteAlpha'}>
            <Tag.Label>{t('Restock.est-profit')}</Tag.Label>
          </Tag.Root>
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
          <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette={'whiteAlpha'}>
            <Tag.Label>{t('Restock.restock-price')}</Tag.Label>
          </Tag.Root>
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
            <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette={'whiteAlpha'}>
              <Tag.Label>{t('Restock.latest-restock')}</Tag.Label>
            </Tag.Root>
            <Text flex="1" fontSize="xs" textAlign="right">
              {lastSeen?.restock && (
                <>
                  {format.dateTime(new Date(lastSeen.restock), {
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
          <>
            <HStack>
              <Tooltip
                label={t('Restock.ht-next-discount-day', {
                  x: format.dateTime(nextThirdWednesday(), {
                    month: 'short',
                    day: 'numeric',
                  }),
                })}
              >
                <Tag.Root
                  size="md"
                  fontWeight="bold"
                  as="h3"
                  cursor="default"
                  colorPalette={'whiteAlpha'}
                >
                  <Tag.Label>
                    {t('Restock.discounted-price')}{' '}
                    <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
                  </Tag.Label>
                </Tag.Root>
              </Tooltip>
              <Text flex="1" fontSize="xs" textAlign="right">
                {format.number(Math.round(item.estVal * 0.97))} NP
              </Text>
            </HStack>
            <HStack>
              <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette={'whiteAlpha'}>
                <Tag.Label>{t('Restock.random-event-price')}</Tag.Label>
              </Tag.Root>
              <Text flex="1" fontSize="xs" textAlign="right">
                {format.number(Math.round(item.estVal * 0.9))} NP
              </Text>
            </HStack>
          </>
        )}
      </Flex>
    </CardBase>
  );
}

function getRestockSpecialDay(item: ItemData, isHT: boolean | undefined, todayNST: Date) {
  if (!item.category) return null;
  const category = item.category.toLowerCase();

  if (isHT) {
    if (isThirdWednesday()) return 'ht';
    return;
  }

  if (todayNST.getDate() === 3) return 'hpd';
  if (
    todayNST.getMonth() === 4 &&
    todayNST.getDate() === 12 &&
    tyrannianShops.map((x) => x.toLowerCase()).includes(category)
  ) {
    return 'tyrannia';
  }

  if (todayNST.getMonth() === 7 && todayNST.getDate() === 20 && category === 'usuki doll') {
    return 'usukicon';
  }

  if (
    todayNST.getMonth() === 8 &&
    todayNST.getDate() === 20 &&
    faerielandShops.map((x) => x.toLowerCase()).includes(category)
  ) {
    return 'festival';
  }

  if (
    todayNST.getMonth() === 9 &&
    todayNST.getDate() === 31 &&
    halloweenShops.map((x) => x.toLowerCase()).includes(category)
  ) {
    return 'halloween';
  }

  return '';
}
