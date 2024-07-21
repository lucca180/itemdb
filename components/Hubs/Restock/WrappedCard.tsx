import { Avatar, Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { RestockStats } from '../../../types';
import { LegacyRef, useMemo } from 'react';
import Color from 'color';
import { useAuth } from '../../../utils/auth';
import { restockShopInfo } from '../../../utils/utils';
import { useTranslations } from 'next-intl';

type RestockWrappedCardProps = {
  stats: RestockStats;
  innerRef?: LegacyRef<HTMLDivElement> | undefined;
  bgGradient?: string;
  timePeriod?: number;
};
const intl = Intl.NumberFormat();
const fontCss = `
@font-face {
    font-family: "Cocogoose";
    src: url("/fonts/cocogoose.ttf") format("truetype");
    font-style: medium;
    font-display: swap;
  }`;
export const RestockWrappedCard = (props: RestockWrappedCardProps) => {
  const t = useTranslations();

  const { stats, innerRef, bgGradient, timePeriod } = props;
  const { user } = useAuth();

  const hasWrapped = useMemo(() => {
    if (!stats) return false;
    if (!stats.mostExpensiveBought) return false;
    // if(!stats.mostExpensiveLost) return false;

    return true;
  }, [stats]);

  const mainColor = Color(stats.mostExpensiveBought?.color.hex).lightness(72).saturationl(70);

  if (!hasWrapped || !user) return null;

  return (
    <Flex
      w={325}
      h={450}
      bg={mainColor.hex()}
      bgImage={bgGradient}
      color={mainColor.isLight() ? 'blackAlpha.800' : 'whiteAlpha.800'}
      p={3}
      flexFlow={'column'}
      borderRadius={'md'}
      ref={innerRef}
      position={'relative'}
    >
      <style>{fontCss}</style>
      <Box
        position={'absolute'}
        w="325px"
        left={0}
        top={0}
        h="450px"
        bgImage={`url("/img/noise.svg")`}
        zIndex={0}
        borderRadius={'md'}
        opacity={0.67}
      />
      <Flex w="100%" h="100%" flexFlow={'column'} gap={4} zIndex={1}>
        <Flex alignItems={'center'} gap={2}>
          {user?.profileImage && (
            <Avatar
              crossOrigin="anonymous"
              src={user?.profileImage}
              width={'25px'}
              height={'25px'}
              name={user.username ?? 'itemdb user'}
            />
          )}
          <Flex gap={2} alignItems={'baseline'} display="inline-flex">
            <Text fontSize={'sm'} fontWeight={'500'}>
              {user.username ?? 'itemdb user'}
            </Text>
            {timePeriod && (
              <Text fontSize={'xs'} p={0}>
                {timePeriod > 1
                  ? t('General.last-x-days', { x: timePeriod })
                  : t('General.last-x-hours', { x: timePeriod * 24 })}
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex position={'relative'} h={'80px'}>
          <Box position={'relative'} flex={1}>
            {stats.hottestBought.slice(0, 5).map((item, i) => (
              <Image
                position={'absolute'}
                src={item.item.image}
                key={i}
                zIndex={5 - i}
                left={i * 50 + 20 + 'px'}
                top={i * 2.5 + 'px'}
                w={80 - i * 5 + 'px'}
                h={80 - i * 5 + 'px'}
                alt={item.item.name}
                borderRadius={'md'}
              />
            ))}
          </Box>
        </Flex>
        <Flex flexFlow={'column'}>
          <Heading size="md" color={mainColor.lightness(65).negate().hex()} fontWeight={900}>
            {t('Restock.hottest-buys').toUpperCase()}
          </Heading>
          <Flex mt={3} minH={'120px'}>
            <Flex w="50%" flexFlow="column" gap={1}>
              {stats.hottestBought.slice(0, 5).map((item, index) => (
                <Text
                  fontSize={'sm'}
                  fontWeight={700}
                  key={index}
                  textOverflow={'ellipsis'}
                  overflow={'hidden'}
                  whiteSpace={'nowrap'}
                >
                  {item.item.name}
                </Text>
              ))}
            </Flex>
            <Flex w="50%" flexFlow="column" gap={1}>
              {stats.hottestBought.slice(0, 5).map((item, index) => (
                <Text fontSize={'sm'} key={index} textAlign={'right'}>
                  {intl.format(item.item.price.value ?? 0)} NP
                </Text>
              ))}
            </Flex>
          </Flex>
        </Flex>
        <Flex mt={3}>
          <Flex flexFlow="column" flex="1 0 0" gap={1}>
            <Heading size="sm" color={mainColor.lightness(65).negate().hex()} fontWeight={900}>
              {t('Restock.est-revenue').toUpperCase()}
            </Heading>
            <Text fontSize={'lg'} fontWeight={700}>
              {intl.format(stats.estRevenue)} NP
            </Text>
          </Flex>
          <Flex flexFlow="column" flex="1 0 0" alignItems={'flex-end'} gap={1}>
            <Heading size="sm" color={mainColor.lightness(65).negate().hex()} fontWeight={900}>
              {t('Restock.favorite-shop').toUpperCase()}
            </Heading>
            <Text fontSize={'md'} fontWeight={700} textAlign={'right'}>
              {restockShopInfo[stats.mostPopularShop.shopId].name}
            </Text>
          </Flex>
        </Flex>
        <Flex flex={1} alignItems={'flex-end'} opacity={0.9}>
          <Flex alignItems={'center'} gap={1}>
            <Image src={'/logo_icon.svg'} w={'25px'} h={'25px'} alt="itemdb logo" />
            <Text fontSize={'xs'} fontFamily={'Cocogoose'}>
              itemdb.com.br/restock
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
