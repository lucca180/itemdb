import { UserList } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { listCategoriesData } from '../../pages/lists/official/cat/[category]';
import { slugify } from '../../utils/utils';

type ListBreadcrumb = {
  list: UserList;
};

export const ListBreadcrumb = (props: ListBreadcrumb) => {
  const { list } = props;
  const t = useTranslations();
  const router = useRouter();

  const category = list.officialTag ?? null;

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('General.official-lists'),
        item: '/lists/official',
      },
    ];

    if (category) {
      if (category === 'The Void Within') {
        breadList.push({
          position: 3,
          name: 'The Void Within',
          item: '/hub/the-void-within',
        });
      } else if (listCategoriesData[slugify(category)]) {
        const { name } = listCategoriesData[slugify(category)];
        breadList.push({
          position: 3,
          name: name,
          item: `/lists/official/cat/${slugify(category)}`,
        });
      } else {
        breadList.push({
          position: 3,
          name: capitalize(category),
          item: `/lists/official?cat=${category}`,
        });
      }
    }

    breadList.push({
      position: breadList.length + 1,
      name: list.name,
      item: `/lists/official/${list.slug ?? list.internal_id}`,
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
