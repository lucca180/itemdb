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

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('Layout.articles'),
        item: '/articles',
      },
      {
        position: 4,
        name: article.title,
        item: `/articles/${article.slug}`,
      },
    ];

    return breadList;
  }, [article, router.locale]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};
