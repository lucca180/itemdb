import { getTranslations } from 'next-intl/server';

export type ArticlesPageLabels = {
  title: string;
  showMore: string;
  showLess: string;
};

export async function buildArticlesPageProps(): Promise<ArticlesPageLabels> {
  const t = await getTranslations();

  return {
    title: t('Articles.all-articles'),
    showMore: t('ItemPage.show-more'),
    showLess: t('ItemPage.show-less'),
  };
}
