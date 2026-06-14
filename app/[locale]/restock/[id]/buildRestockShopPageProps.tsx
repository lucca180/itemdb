import type { ReactNode } from 'react';
import { HStack, Image, Link, Text } from '@chakra-ui/react';
import { createRestockBreadcrumbList } from '@components/Breadcrumbs/RestockBreadcrumb';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import type { RestockHeaderSpecialDayLabels } from '@components/Hubs/Restock/RestockHeader';
import { ShopInfoCard } from '@components/Hubs/Restock/ShopInfoCard';
import MainLink from '@components/Utils/MainLink';
import { Link as I18nLink } from '@i18n/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ShopInfo } from '@types';
import { shopIDToCategory, slugify } from '@utils/utils';

export type RestockShopClientLabels = {
  items: string;
  sortBy: string;
  useClassicView: string;
  useRarityView: string;
};

export type RestockShopPageLabels = RestockShopClientLabels & {
  breadcrumbList: BreadcrumbItem[];
  headerContent: ReactNode;
  historyCta: ReactNode;
  specialDayLabels: RestockHeaderSpecialDayLabels;
  bmgWarning: ReactNode;
  infoUpToDateWarning: string;
  learnHelp: string;
  similarShops: string;
  metaDescription: string;
};

type RestockShopStats = {
  totalItems: number;
  profitableCount: number;
  profitMean: number;
};

export async function buildRestockShopPageProps(
  shopInfo: ShopInfo,
  stats: RestockShopStats
): Promise<RestockShopPageLabels> {
  const t = await getTranslations();
  const format = await getFormatter();

  return {
    breadcrumbList: createRestockBreadcrumbList(shopInfo, t),
    metaDescription: t('Restock.shop-desc', {
      0: shopInfo.name,
      category: shopInfo.category,
    }),
    headerContent: (
      <>
        <Text as="h2" textAlign="center">
          {t.rich('Restock.profitable-items-from', {
            Link: (chunk) => (
              <Link
                href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {chunk}
                <Image
                  src="/icons/neopets.png"
                  width="16px"
                  height="16px"
                  style={{ display: 'inline', verticalAlign: 'middle' }}
                  alt="link icon"
                />
              </Link>
            ),
            shopname: shopInfo.name,
          })}
        </Text>
        <Text as="h3" textAlign="center">
          <Link asChild>
            <MainLink
              href={`/search?s=&category[]=${shopIDToCategory[shopInfo.id]}&rarity[]=1&rarity[]=100`}
              prefetch={false}
            >
              {t('Restock.view-all-items-from-this-shop')}
              <Image
                src="/favicon.svg"
                width="18px"
                height="18px"
                style={{ display: 'inline', verticalAlign: 'middle' }}
                alt="link icon"
              />
            </MainLink>
          </Link>
        </Text>
        <HStack alignItems="stretch" justifyContent="center" flexWrap="wrap" mt={3}>
          <ShopInfoCard>
            <Text fontSize="xs">
              {t.rich('Restock.shop-info-category', {
                b: (chunk) => <b>{chunk}</b>,
                rawCat: shopInfo.category,
                name: shopInfo.name,
                category: shopIDToCategory[shopInfo.id],
                Link: (chunk) => (
                  <Link asChild textTransform="capitalize">
                    <MainLink
                      href={`/search?s=&category[]=${shopIDToCategory[shopInfo.id]}`}
                      prefetch={false}
                    >
                      {chunk}
                    </MainLink>
                  </Link>
                ),
              })}
            </Text>
          </ShopInfoCard>
          <ShopInfoCard>
            <Text fontSize="xs">
              {t.rich('Restock.ats-total-items', {
                b: (chunk) => <b>{chunk}</b>,
                totalItems: format.number(stats.totalItems),
                profitableCount: format.number(stats.profitableCount),
              })}
            </Text>
          </ShopInfoCard>
          <ShopInfoCard>
            <Text fontSize="xs">
              {t.rich('Restock.ats-avg-profit', {
                b: (chunk) => <b>{chunk}</b>,
                x: format.number(stats.profitMean),
              })}
            </Text>
          </ShopInfoCard>
        </HStack>
      </>
    ),
    historyCta: (
      <Text mt={3} fontSize="sm" textAlign="center">
        {t.rich('Restock.history-cta', {
          Link: (chunk) => (
            <Link asChild>
              <I18nLink href={`/restock/${slugify(shopInfo.name)}/history`}>
                {chunk}
                <Image
                  src="/favicon.svg"
                  width="18px"
                  height="18px"
                  style={{ display: 'inline', verticalAlign: 'middle' }}
                  alt="link icon"
                />
              </I18nLink>
            </Link>
          ),
        })}
      </Text>
    ),
    specialDayLabels: {
      hpd: t('Restock.half-price-day'),
      tyrannia: t('Restock.tyrannian-victory-day'),
      usukicon: t('Restock.usuki-day'),
      festival: t('Restock.faerie-festival'),
      halloween: t('Restock.halloween'),
    },
    items: t('General.items'),
    sortBy: t('General.sort-by'),
    useClassicView: t('Restock.use-classic-view'),
    useRarityView: t('Restock.use-rarity-view'),
    bmgWarning: t.rich('Restock.bmg-warning', {
      Link: (chunk) => (
        <Link asChild color="yellow.200">
          <MainLink href="/lists/official/1952" prefetch={false}>
            {chunk}
          </MainLink>
        </Link>
      ),
    }),
    infoUpToDateWarning: t('Restock.info-up-to-date-warning'),
    learnHelp: t('General.learnHelp'),
    similarShops: t('Restock.similar-shops'),
  };
}
