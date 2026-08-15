'use client';

import { ItemData, UserList } from '../../types';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { categoryToShopID, restockShopInfo, slugify } from '../../utils/utils';
import { resolvePageLocale } from '../../utils/locales';
import { STYLES_BASE_PATH } from '@utils/petStyles/paths';
import { ProductJsonLd, ProductJsonLdProps } from 'next-seo';
import type { BreadcrumbItem } from './types';

type ItemBreadcrumbProps = {
  item: ItemData;
  officialLists?: UserList[];
  /** Combo / hub href when this item is a Pet Style token. */
  petStyleHref?: string;
  useAppDir?: boolean;
  /** When false, skip Product/Breadcrumb JSON-LD (e.g. Suspense fallback). Default true. */
  includeJsonLd?: boolean;
};

function isLikelyPetStyleToken(item: ItemData) {
  return (item.category ?? '').toLowerCase() === 'special' && /\btoken$/i.test(item.name.trim());
}

export const ItemBreadcrumb = (props: ItemBreadcrumbProps) => {
  const { item, officialLists, petStyleHref, useAppDir = false, includeJsonLd = true } = props;
  const t = useTranslations();
  const locale = useLocale();
  const category = (item.category ?? 'unknown').toLowerCase();

  const breadcrumbList = useMemo(() => {
    const breadList: BreadcrumbItem[] = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('General.items'),
        item: '/search?s=',
        nofollow: true,
      },
      {
        position: 3,
        name: capitalize(category),
        item: `/search?s=&category[]=${category}`,
        nofollow: true,
      },
      {
        position: 4,
        name: item.name,
        item: `/item/${item.slug}`,
      },
    ];

    const petStylesHref = petStyleHref ?? (isLikelyPetStyleToken(item) ? STYLES_BASE_PATH : null);

    if (petStylesHref) {
      breadList[2] = {
        position: 3,
        name: t('PetStyles.breadcrumb'),
        item: petStylesHref,
      };
    } else if (item.findAt.restockShop && item.category && item.rarity && item.rarity < 100) {
      const shopInfo = restockShopInfo[categoryToShopID[item.category.toLowerCase()]];

      if (!shopInfo || !shopInfo.name) return breadList;

      breadList[2] = {
        position: 3,
        name: shopInfo.name,
        item: `/restock/${slugify(shopInfo.name)}`,
      };
    } else if (officialLists && officialLists.length === 1) {
      const list = officialLists[0];
      breadList[2] = {
        position: 3,
        name: list.name,
        item: `/lists/official/${list.slug}`,
      };
    }

    return breadList;
  }, [item, locale, category, t, officialLists, petStyleHref]);

  const productJson = includeJsonLd ? getItemJSONLD(item) : null;
  return (
    <>
      <Breadcrumbs
        breadcrumbList={breadcrumbList}
        useAppDir={useAppDir}
        locale={resolvePageLocale(locale)}
        includeJsonLd={includeJsonLd}
      />
      {productJson && <ProductJsonLd {...productJson} useAppDir={useAppDir} />}
    </>
  );
};

// capitalize first letter of each word in a string
const capitalize = (s: string) => {
  return s
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Product schema without Offer — NP/NC are not ISO 4217 currencies,
 * so priceCurrency values like "XXX" fail Google rich-result validation.
 */
const getItemJSONLD = (item: ItemData): ProductJsonLdProps => {
  const cacheHash = item.cacheHash ? '?hash=' + item.cacheHash : '';

  const img = [
    item.isWearable
      ? `https://itemdb.com.br/api/cache/preview/${item.image_id}.png${cacheHash}`
      : null,
    item.image,
  ].filter(Boolean) as string[];

  return {
    productName: item.name,
    description: item.description,
    sku: (item.item_id || item.internal_id).toString(),
    images: img,
  };
};
