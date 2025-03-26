import { UserList } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

type ListBreadcrumb = {
  list: UserList;
};

export const ListBreadcrumb = (props: ListBreadcrumb) => {
  const { list } = props;
  const t = useTranslations();
  const router = useRouter();

  const category = list.officialTag ?? null;

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
        name: t('General.official-lists'),
        item: getLink('/lists/official'),
      },
    ];

    if (category) {
      breadList.push({
        position: 3,
        name: capitalize(category),
        item: getLink(`/lists/official?cat=${category}`),
      });
    }

    breadList.push({
      position: breadList.length + 1,
      name: list.name,
      item: getLink(`/lists/official/${list.slug ?? list.internal_id}`),
    });

    return breadList;
  }, [list, router.locale]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};

// capitalize first letter of each word in a string
const capitalize = (s: string) => {
  return s
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
