import { ItemData } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

type ItemBreadcrumbProps = {
  item: ItemData;
};

export const ItemBreadcrumb = (props: ItemBreadcrumbProps) => {
  const { item } = props;
  const t = useTranslations();
  const router = useRouter();
  const category = (item.category ?? 'unknown').toLowerCase();

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
        name: t('General.items'),
        item: getLink('/search?s='),
      },
      {
        position: 3,
        name: capitalize(category),
        item: getLink(`/search?s=&category[]=${category}`),
      },
      {
        position: 4,
        name: item.name,
        item: getLink(`/items/${item.slug}`),
      },
    ];
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
