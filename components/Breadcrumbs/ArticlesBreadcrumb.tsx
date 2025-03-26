import { WP_Article } from '../../types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

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

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};
