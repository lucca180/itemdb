import { BreadcrumbJsonLd } from 'next-seo';
import { WP_Article } from '../../types';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

type ArticleBreadcrumb = {
  article: WP_Article;
};

export const ArticleBreadcrumb = (props: ArticleBreadcrumb) => {
  const { article } = props;
  const t = useTranslations();
  const router = useRouter();

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
        name: t('Layout.articles'),
        item: getLink('/articles'),
      },
      {
        position: 4,
        name: article.title,
        item: getLink(`/articles/${article.slug}`),
      },
    ];

    return breadList;
  }, [article, router.locale]);

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
