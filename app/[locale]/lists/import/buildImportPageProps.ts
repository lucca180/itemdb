import 'server-only';

import { getTranslations } from 'next-intl/server';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { ListService } from '@services/ListService';
import { resolveImportRecommendedListId } from '@utils/list/importMeta';
import { getListImportSession } from '@utils/list/importSession';
import type { UserList } from '@types';

export type ImportPageLabels = {
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  description: string;
  importToken: string | null;
  itemCount: number;
  indexType?: string;
  recommended_list: UserList | null;
  /** Token was present in the URL but the Redis/dev session is gone. */
  sessionExpired: boolean;
};

export async function buildImportPageProps(
  locale: string,
  importToken?: string
): Promise<ImportPageLabels> {
  const t = await getTranslations();
  const importSession = importToken ? await getListImportSession(importToken) : null;
  const items = importSession?.items ?? null;
  const indexType = importSession?.indexType ?? 'item_id';
  const list_id = importSession
    ? await resolveImportRecommendedListId({
        meta: importSession.meta,
        list_id: importSession.list_id,
      })
    : null;

  const listService = ListService.init();
  const recommended_list = list_id
    ? await listService.getList({
        username: 'official',
        listId: list_id,
        isOfficial: true,
      })
    : null;

  return {
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Lists.Lists'), item: '/lists/official' },
      { position: 3, name: t('Lists.checklists-and-importing-items'), item: '/lists/import' },
    ],
    heading: t('Lists.checklists-and-importing-items'),
    description: t('Lists.import-page-description'),
    importToken: items ? (importToken ?? null) : null,
    itemCount: items ? Object.keys(items).length : 0,
    indexType: items ? indexType : undefined,
    recommended_list,
    sessionExpired: Boolean(importToken && !items),
  };
}
