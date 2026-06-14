'use client';

import { Badge, Box, Center, Heading, HStack, Image, Link, Tag, Text } from '@chakra-ui/react';
import Color from 'color';
import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { createRestockBreadcrumbList } from '@components/Breadcrumbs/RestockBreadcrumb';
import MainLink from '@components/Utils/MainLink';
import ChakraImage from '@components/Utils/Image';
import type { ShopInfo } from '@types';
import {
  faerielandShops,
  getDateNST,
  halloweenShops,
  shopIDToCategory,
  slugify,
  tyrannianShops,
} from '@utils/utils';
import { resolvePageLocale } from '@utils/locales';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, type ReactNode } from 'react';

type RestockHeaderClientProps = {
  shop: ShopInfo;
  children?: ReactNode;
  isHistory?: boolean;
};

export default function RestockHeaderClient({
  shop: shopInfo,
  children,
  isHistory,
}: RestockHeaderClientProps) {
  const t = useTranslations();
  const locale = useLocale();

  const color = Color(shopInfo.color);
  const rgb = color.rgb().array();

  const breadcrumbList = useMemo(
    () => createRestockBreadcrumbList(shopInfo, t, isHistory),
    [shopInfo, t, isHistory]
  );

  const specialDay = useMemo(() => {
    const shopCategory = shopIDToCategory[shopInfo.id];
    const todayNST = getDateNST();

    if (todayNST.getDate() === 3) return 'hpd';
    if (
      todayNST.getMonth() === 4 &&
      todayNST.getDate() === 12 &&
      tyrannianShops.map((x) => x.toLowerCase()).includes(shopCategory)
    ) {
      return 'tyrannia';
    }
    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20 && shopCategory === 'usuki doll') {
      return 'usukicon';
    }
    if (
      todayNST.getMonth() === 8 &&
      todayNST.getDate() === 20 &&
      faerielandShops.map((x) => x.toLowerCase()).includes(shopCategory)
    ) {
      return 'festival';
    }
    if (
      todayNST.getMonth() === 9 &&
      todayNST.getDate() === 31 &&
      halloweenShops.map((x) => x.toLowerCase()).includes(shopCategory)
    ) {
      return 'halloween';
    }
  }, [shopInfo.id]);

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.5) 70%)`}
        zIndex={-1}
      />
      <Box mt={2}>
        <Breadcrumbs breadcrumbList={breadcrumbList} locale={resolvePageLocale(locale)} />
      </Box>
      <Center
        mt={2}
        mb={6}
        flexFlow="column"
        gap={2}
        css={{ '& a': { color: Color(shopInfo.color).lightness(70).hex() } }}
      >
        {!isHistory && (
          <HStack>
            <Link asChild>
              <MainLink href="/restock" prefetch={false}>
                <Badge>{shopInfo.category}</Badge>
              </MainLink>
            </Link>
            {shopInfo.difficulty.toLowerCase() !== 'medium' && (
              <Link asChild>
                <MainLink href="/restock" prefetch={false}>
                  <Badge
                    colorPalette={
                      shopInfo.difficulty.toLowerCase() === 'beginner' ? 'green' : 'red'
                    }
                  >
                    {shopInfo.difficulty}
                  </Badge>
                </MainLink>
              </Link>
            )}
          </HStack>
        )}
        {isHistory && (
          <HStack>
            <Badge colorPalette="orange">Restock History</Badge>
          </HStack>
        )}
        <Link
          href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <ChakraImage
            priority
            quality={90}
            src={`https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`}
            width={450}
            height={150}
            alt={`${shopInfo.name} thumbnail`}
            borderRadius="md"
            objectFit="cover"
            boxShadow="sm"
          />
        </Link>
        <Heading as="h1">{shopInfo.name}</Heading>
        {children}
        {!isHistory && (
          <Text mt={3} fontSize="sm" textAlign="center">
            {t.rich('Restock.history-cta', {
              Link: (chunk) => (
                <Link asChild>
                  <MainLink href={`/restock/${slugify(shopInfo.name)}/history`} prefetch={false}>
                    {chunk}
                    <Image
                      src="/favicon.svg"
                      width="18px"
                      height="18px"
                      style={{ display: 'inline', verticalAlign: 'middle' }}
                      alt="link icon"
                    />
                  </MainLink>
                </Link>
              ),
            })}
          </Text>
        )}
        {specialDay === 'hpd' && (
          <Tag.Root colorPalette="green">
            <Tag.Label>{t('Restock.half-price-day')}</Tag.Label>
          </Tag.Root>
        )}
        {specialDay === 'tyrannia' && (
          <Tag.Root colorPalette="orange">
            <Tag.Label>{t('Restock.tyrannian-victory-day')}</Tag.Label>
          </Tag.Root>
        )}
        {specialDay === 'usukicon' && (
          <Tag.Root colorPalette="pink">
            <Tag.Label>{t('Restock.usuki-day')}</Tag.Label>
          </Tag.Root>
        )}
        {specialDay === 'festival' && (
          <Tag.Root colorPalette="purple">
            <Tag.Label>{t('Restock.faerie-festival')}</Tag.Label>
          </Tag.Root>
        )}
        {specialDay === 'halloween' && (
          <Tag.Root colorPalette="orange">
            <Tag.Label>{t('Restock.halloween')}</Tag.Label>
          </Tag.Root>
        )}
      </Center>
    </>
  );
}
