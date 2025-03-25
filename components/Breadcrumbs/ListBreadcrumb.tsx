import { BreadcrumbJsonLd } from 'next-seo';
import { UserList } from '../../types';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

type ListBreadcrumb = {
  list: UserList;
};

export const ListBreadcrumb = (props: ListBreadcrumb) => {
  const { list } = props;
  const t = useTranslations();
  const router = useRouter();

  const category = list.officialTag ?? 'Uncategorized';

  const getLink = (url: string) => {
    const locale = router.locale === 'en' ? '' : `/${router.locale}`;
    return `https://itemdb.com.br${locale}${url}`;
  };

  const removeLink = (url: string) => {
    return url.replace('https://itemdb.com.br', '');
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
      {
        position: 3,
        name: capitalize(category),
        item: getLink(`/lists/official?cat=${category}`),
      },
      {
        position: 4,
        name: list.name,
        item: getLink(`/lists/official/${list.slug ?? list.internal_id}`),
      },
    ];
    return breadList;
  }, [list, router.locale]);

  return (
    <>
      <Breadcrumb
        spacing="2px"
        fontSize={'xs'}
        separator={<ChevronRightIcon color="whiteAlpha.800" />}
        color="whiteAlpha.800"
      >
        {breadcrumbList.map((crumb, i) => (
          <BreadcrumbItem key={crumb.position} isCurrentPage={i === breadcrumbList.length - 1}>
            <BreadcrumbLink
              as={i === breadcrumbList.length - 1 ? undefined : NextLink}
              href={removeLink(crumb.item)}
            >
              {crumb.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      <BreadcrumbJsonLd itemListElements={breadcrumbList} />
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
