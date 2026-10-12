import { Box } from '@chakra-ui/react';
import { BreadcrumbsView } from './BreadcrumbsView';
import type { BreadcrumbItem } from './types';

const BASE_PATH = '/tools';

type ToolsBreadcrumbTranslator = (key: string) => string;

type ToolsBreadcrumbsProps = {
  breadcrumbList: BreadcrumbItem[];
  locale: string;
};

/** Home › Tools › … for pages listed on /tools that have no breadcrumb of their own. */
export function ToolsBreadcrumbs({ breadcrumbList, locale }: ToolsBreadcrumbsProps) {
  return (
    <Box mt={2}>
      <BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />
    </Box>
  );
}

export function createToolsBreadcrumbList(
  t: ToolsBreadcrumbTranslator,
  extra: { name: string; item: string }[] = []
): BreadcrumbItem[] {
  const breadcrumbList: BreadcrumbItem[] = [
    { position: 1, name: t('Layout.home'), item: '/' },
    { position: 2, name: t('Layout.tools'), item: BASE_PATH },
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
