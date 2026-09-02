import { Center, Flex, HStack, Tag, Text, Link, Badge } from '@chakra-ui/react';
import { ItemData, ItemMallData, NCMallData } from '@types';
import CardBase from '@components/Card/CardBase';
import MainLink from '@components/Utils/MainLink';
import Color from 'color';
import Image from 'next/image';
import { getFormatter, getTranslations } from 'next-intl/server';

type Props = {
  item: ItemData;
  ncMallData: NCMallData;
  now: number;
  startDate: number | null;
  endDate: number | null;
};

export default async function NcMallCard(props: Props) {
  const t = await getTranslations();
  const format = await getFormatter();
  const { item, ncMallData, now, startDate, endDate } = props;

  const isDiscounted = isMallDiscounted(ncMallData, now);

  const isBuyable =
    ncMallData.active && (!ncMallData.saleEnd || new Date(ncMallData.saleEnd).getTime() > now);

  const color = Color(item.color.hex);

  return (
    <CardBase title={t('ItemPage.nc-mall-info')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link href={getNCMallLink(item)} target="_blank" rel="noreferrer">
            <Image
              src={'https://images.neopets.com/ncmall/shopkeepers/exclusive_shop1.png'}
              width={600}
              height={200}
              alt="nc mall thumb"
              quality={100}
            />
          </Link>
          {isBuyable && !isDiscounted && (
            <Badge fontSize="xs" colorPalette={'yellow'}>
              {t('ItemPage.buyable-right-now')}
            </Badge>
          )}
          {isBuyable && isDiscounted && (
            <Badge fontSize="xs" colorPalette={'orange'}>
              {t('ItemPage.on-sale')}
            </Badge>
          )}
          {!isBuyable && (
            <Badge fontSize="xs" colorPalette={'red'}>
              {t('ItemPage.retired')}
            </Badge>
          )}
        </Center>
        <HStack>
          <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette="whiteAlpha">
            <Tag.Label>{t('General.price')}</Tag.Label>
          </Tag.Root>
          <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
            {isDiscounted && (
              <Badge
                fontSize="xs"
                colorPalette={isDiscounted ? 'orange' : undefined}
                textAlign={'right'}
              >
                {ncMallData.discountPrice} NC <br /> {t('General.until')}{' '}
                {format.dateTime(new Date(ncMallData.discountEnd ?? 0), {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Badge>
            )}
            <Badge
              fontSize="xs"
              colorPalette={isDiscounted ? undefined : 'purple'}
              textDecoration={isDiscounted ? 'line-through' : undefined}
            >
              {ncMallData.price > 0 && `${ncMallData.price} NC`}
              {ncMallData.price === 0 && t('ItemPage.free')}
            </Badge>
          </Flex>
        </HStack>
        {startDate && (
          <HStack>
            <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette="whiteAlpha">
              <Tag.Label>{t('ItemPage.since')}</Tag.Label>
            </Tag.Root>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(startDate, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Flex>
          </HStack>
        )}
        {endDate && (
          <HStack>
            <Tag.Root size="md" fontWeight="bold" as="h3" colorPalette="whiteAlpha">
              <Tag.Label>{t('ItemPage.until')}</Tag.Label>
            </Tag.Root>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(endDate, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Flex>
          </HStack>
        )}
        <Flex
          justifyContent="flex-start"
          mt={1}
          css={{ '& a': { color: color.lightness(70).hex() } }}
        >
          <Link asChild fontSize="sm">
            <MainLink href="/mall" trackEvent="nc-mall-info" trackEventLabel="hub">
              {t('ItemPage.nc-mall-hub')} →
            </MainLink>
          </Link>
        </Flex>
      </Flex>
    </CardBase>
  );
}

export const isMallDiscounted = (
  ncMallData?: ItemMallData | null,
  now: number = Date.now()
): boolean => {
  if (!ncMallData) return false;
  return !!ncMallData.discountPrice && new Date(ncMallData.discountEnd ?? 0).getTime() > now;
};

export const getNCMallLink = (item: ItemData) => {
  const name = encodeURI(item.name.split(' ').join('+').toLowerCase());

  return `https://ncmall.neopets.com/mall/search.phtml?type=search&text=${name}&utm_source=itemdb.com.br`;
};
