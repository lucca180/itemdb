import { useTranslations } from 'next-intl';
import type { DynamicListTypes, UserList } from '@types';

type DynamicListInfo = Pick<UserList, 'dynamicType' | 'official'>;

/**
 * Full Sync lists read as checklists, whatever they follow.
 * Official lists are what people follow, so they keep the generic name.
 */
export const isChecklist = ({ dynamicType, official }: DynamicListInfo) =>
  dynamicType === 'fullSync' && !official;

export const useDynamicListLabels = () => {
  const t = useTranslations();

  const getNoun = (list: DynamicListInfo) =>
    isChecklist(list) ? t('DynamicList.checklist') : t('General.dynamic-list');

  const getModeName = (mode: DynamicListTypes) => t(`DynamicList.mode-${mode}`);

  /** e.g. "Checklist · Stay in sync" */
  const getFullLabel = (list: DynamicListInfo) =>
    list.dynamicType ? `${getNoun(list)} · ${getModeName(list.dynamicType)}` : '';

  return { getNoun, getModeName, getFullLabel };
};
