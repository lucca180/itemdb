import { ShopInfo } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { slugify } from '../../utils/utils';
import { Breadcrumbs } from './Breadcrumbs';

type RestockBreadcrumb = {
  shopData: ShopInfo;
  isHistory?: boolean;
};

export const RestockBreadcrumb = (props: RestockBreadcrumb) => {
  const { shopData } = props;
  const t = useTranslations();
  const router = useRouter();

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('Layout.restock'),
        item: '/restock',
      },
      {
        position: 3,
        name: shopData.name,
        item: `/restock/${slugify(shopData.name)}`,
      },
    ];

    if (props.isHistory) {
      breadList.push({
        position: 4,
        name: t('Restock.restock-history'),
        item: `/restock/${slugify(shopData.name)}/history`,
      });
    }

    return breadList;
  }, [shopData, router.locale, t, slugify, props.isHistory]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};
