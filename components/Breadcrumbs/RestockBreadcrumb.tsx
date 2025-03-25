import { BreadcrumbJsonLd } from 'next-seo';
import { ShopInfo } from '../../types';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { slugify } from '../../utils/utils';

type RestockBreadcrumb = {
  shopData: ShopInfo;
  isHistory?: boolean;
};

export const RestockBreadcrumb = (props: RestockBreadcrumb) => {
  const { shopData } = props;
  const t = useTranslations();
  const router = useRouter();

  const category = shopData.category;

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
        name: t('Layout.restock'),
        item: getLink('/restock'),
      },
      {
        position: 3,
        name: capitalize(category),
        item: getLink(`/restock?cat=${category}`),
      },
      {
        position: 4,
        name: shopData.name,
        item: getLink(`/restock/${slugify(shopData.name)}`),
      },
    ];

    if (props.isHistory) {
      breadList.push({
        position: 5,
        name: t('Restock.restock-history'),
        item: getLink(`/restock/${slugify(shopData.name)}/history`),
      });
    }

    return breadList;
  }, [shopData, router.locale]);

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
