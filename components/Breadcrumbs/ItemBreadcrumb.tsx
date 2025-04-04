import { ItemData } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { categoryToShopID, restockShopInfo, slugify } from '../../utils/utils';

type ItemBreadcrumbProps = {
  item: ItemData;
};

export const ItemBreadcrumb = (props: ItemBreadcrumbProps) => {
  const { item } = props;
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
        item: `/items/${item.slug}`,
      },
    ];

    if (item.findAt.restockShop && item.category && item.rarity && item.rarity < 100) {
      const shopInfo = restockShopInfo[categoryToShopID[item.category.toLowerCase()]];

      if (!shopInfo || !shopInfo.name) return breadList;

      breadList[2] = {
        position: 2,
        name: shopInfo.name,
        item: `/restock/${slugify(shopInfo.name)}`,
      };
    }

    return breadList;
  }, [item, router.locale]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};

// capitalize first letter of each word in a string
const capitalize = (s: string) => {
  return s
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
