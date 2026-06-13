import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';

export type AdvancedImportPageLabels = {
  locale: string;
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  importDescription: string;
  importAdv1: ReactNode;
  importAdv2: string;
  pastePlaceholder: string;
  importButton: string;
};

export async function buildAdvancedImportPageProps(
  locale: string
): Promise<AdvancedImportPageLabels> {
  const t = await getTranslations();

  return {
    locale,
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Lists.Lists'), item: '/lists/official' },
      { position: 3, name: t('Lists.checklists-and-importing-items'), item: '/lists/import' },
      { position: 4, name: t('Lists.advanced-import'), item: '/lists/import/advanced' },
    ],
    heading: t('Lists.import-from-pps'),
    importDescription: t('Lists.import-advanced-description'),
    importAdv1: t.rich('Lists.import-adv-1', {
      b: (chunks) => <b>{chunks}</b>,
    }),
    importAdv2: t('Lists.import-adv-2'),
    pastePlaceholder: t('Lists.paste-pp-code'),
    importButton: t('Lists.import-items'),
  };
}
