import { BreadcrumbJsonLd } from 'next-seo';
import { ItemData } from '../../types';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

type ItemBreadcrumbProps = {
  item: ItemData;
};

export const ItemBreadcrumb = (props: ItemBreadcrumbProps) => {
  const { item } = props;
  const t = useTranslations();
  const router = useRouter();
  const category = (item.category ?? 'unknown').toLowerCase();
  const specialType = item.isWearable
    ? 'wearable'
    : item.isNeohome
    ? 'neohome'
    : item.isBD
    ? 'battledome'
    : null;

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
        name: item.type.toUpperCase(),
        item: getLink(`/search?s=&category[]=${category}&type[]=${item.type}`),
      },
    ];

    if (specialType) {
      breadList.push({
        position: 5,
        name: item.isWearable
          ? t('General.wearable')
          : item.isNeohome
          ? t('General.neohome')
          : t('General.battledome'),
        item: getLink(
          `/search?s=&category[]=${category}&type[]=${item.type}&type[]=${specialType}`
        ),
      });
    }

    breadList.push({
      position: specialType ? 6 : 5,
      name: item.name,
      item: getLink(`/items/${item.slug}`),
    });

    return breadList;
  }, [item, router.locale]);

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
