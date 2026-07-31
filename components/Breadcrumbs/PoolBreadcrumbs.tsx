import { Box } from '@chakra-ui/react';
import { BreadcrumbsView } from './BreadcrumbsView';
import type { BreadcrumbItem } from './types';

const BASE_PATH = '/tools/rainbow-pool';

type PoolBreadcrumbTranslator = {
  (key: 'Layout.home' | 'Layout.rainbow-pool-tool'): string;
};

type PoolBreadcrumbsProps = {
  breadcrumbList: BreadcrumbItem[];
  locale: string;
};

export function PoolBreadcrumbs({ breadcrumbList, locale }: PoolBreadcrumbsProps) {
  return (
    <Box mt={2}>
      <BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />
    </Box>
  );
}

export function createPoolBreadcrumbList(
  t: PoolBreadcrumbTranslator,
  extra: { name: string; item: string }[] = []
): BreadcrumbItem[] {
  const breadcrumbList: BreadcrumbItem[] = [
    {
      position: 1,
      name: t('Layout.home'),
      item: '/',
    },
    {
      position: 2,
      name: t('Layout.rainbow-pool-tool'),
      item: BASE_PATH,
    },
  ];

  for (const crumb of extra) {
    breadcrumbList.push({
      position: breadcrumbList.length + 1,
      name: crumb.name,
      item: crumb.item,
    });
  }

  return breadcrumbList;
}
