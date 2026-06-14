import type { ShopInfo } from '@types';
import { slugify } from '@utils/utils';
import { BreadcrumbsView } from './BreadcrumbsView';
import type { BreadcrumbItem } from './types';

type RestockBreadcrumbProps = {
  breadcrumbList: BreadcrumbItem[];
  locale: string;
  useAppDir?: boolean;
};

export function RestockBreadcrumb({ breadcrumbList, locale, useAppDir }: RestockBreadcrumbProps) {
  return <BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir={useAppDir} />;
}

type RestockBreadcrumbTranslator = {
  (key: 'Layout.home' | 'Layout.restock' | 'Restock.restock-history'): string;
};

export function createRestockBreadcrumbList(
  shopData: ShopInfo,
  t: RestockBreadcrumbTranslator,
  isHistory = false
): BreadcrumbItem[] {
  const breadcrumbList: BreadcrumbItem[] = [
    {
      position: 1,
      name: t('Layout.home'),
      item: '/',
    },
    {
      position: 2,
      name: t('Layout.restock'),
      item: '/restock',
    },
    {
      position: 3,
      name: shopData.name,
      item: `/restock/${slugify(shopData.name)}`,
    },
  ];

  if (isHistory) {
    breadcrumbList.push({
      position: 4,
      name: t('Restock.restock-history'),
      item: `/restock/${slugify(shopData.name)}/history`,
    });
  }

  return breadcrumbList;
}
