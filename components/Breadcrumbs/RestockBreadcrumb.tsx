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

  const getLink = (url: string) => {
    const locale = router.locale === 'en' ? '' : `/${router.locale}`;
    return `https://itemdb.com.br${locale}${url}`;
  };

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: getLink('/'),
      },
      {
        position: 2,
        name: t('Layout.restock'),
        item: getLink('/restock'),
      },
      {
        position: 3,
        name: shopData.name,
        item: getLink(`/restock/${slugify(shopData.name)}`),
      },
    ];

    if (props.isHistory) {
      breadList.push({
        position: 4,
        name: t('Restock.restock-history'),
        item: getLink(`/restock/${slugify(shopData.name)}/history`),
      });
    }

    return breadList;
  }, [shopData, router.locale]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};
