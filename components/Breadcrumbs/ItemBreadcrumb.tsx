import { ItemData, UserList } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { categoryToShopID, restockShopInfo, slugify } from '../../utils/utils';
import { ProductJsonLd, ProductJsonLdProps } from 'next-seo';

type ItemBreadcrumbProps = {
  item: ItemData;
  officialLists?: UserList[];
};

export const ItemBreadcrumb = (props: ItemBreadcrumbProps) => {
  const { item, officialLists } = props;
  const t = useTranslations();
  const router = useRouter();
  const category = (item.category ?? 'unknown').toLowerCase();

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('General.items'),
        item: '/search?s=',
      },
      {
        position: 3,
        name: capitalize(category),
        item: `/search?s=&category[]=${category}`,
      },
      {
        position: 4,
        name: item.name,
        item: `/item/${item.slug}`,
      },
    ];

    if (item.findAt.restockShop && item.category && item.rarity && item.rarity < 100) {
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
  }, [item, router.locale]);
  const productJson = getItemJSONLD(item);
  return (
    <>
      <Breadcrumbs breadcrumbList={breadcrumbList} />
      {productJson && <ProductJsonLd {...productJson} />}
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

const getItemJSONLD = (item: ItemData): ProductJsonLdProps | null => {
  const cacheHash = item.cacheHash ? '?hash=' + item.cacheHash : '';

  const img = [
    item.isWearable
      ? `https://itemdb.com.br/api/cache/preview/${item.image_id}.png${cacheHash}`
      : null,
    item.image,
  ].filter(Boolean) as string[];

  const offers = [];
  if (item.price.value) {
    offers.push({
      price: item.price.value,
      priceCurrency: 'XXX',
    });
  }

  if (item.mallData?.price) {
    offers.push({
      price: item.mallData.price,
      priceCurrency: 'XXX',
    });
  } else if (item.ncValue?.minValue) {
    offers.push({
      price: item.ncValue.minValue,
      priceCurrency: 'XXX',
    });
  }

  if (!offers.length) return null;

  return {
    productName: item.name,
    description: item.description,
    sku: (item.item_id || item.internal_id).toString(),
    images: img,
    offers: offers,
  };
};
