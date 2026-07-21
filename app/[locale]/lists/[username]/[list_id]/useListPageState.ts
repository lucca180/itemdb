'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ItemV2For, SearchFilters as SearchFiltersType, SearchStats } from '@types';
import { useToast } from '@utils/theme/toast';
import { defaultFilters } from '@utils/parseFilters';
import { useTranslations } from 'next-intl';
import { useRouter } from '@i18n/navigation';
import axios from 'axios';
import {
  applyListFilters,
  loadListStats,
  loadRemainingListItems,
  refreshListData,
} from './actions';
import { getListLoadingStrategy, type ListItemsData, type ListPageClientCore } from './listPage';
import {
  applyDragSortOrder,
  buildListSortTypes,
  computeListQtyCount,
  filterItemInfoIdsBySearch,
  hasServerFilters,
  shouldMergeListItems,
  sortItemInfoIds,
  type ExtendedListItemInfo,
  type ListSortInfo,
  type MergeListItemsOptions,
} from './listPageStateHelpers';
import type { ListFullItemsMergeContextValue } from './listPageSuspenseMerge';

export type UseListPageStateParams = {
  locale: string;
  username: string;
  listId: string;
  core: ListPageClientCore;
  initialPreload: ListItemsData;
};

export function useListPageState({
  locale,
  username,
  listId,
  core,
  initialPreload,
}: UseListPageStateParams) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const { canEdit } = core;

  const loadingStrategy = useMemo(
    () => getListLoadingStrategy(core.list.itemCount ?? 0, { editorNeedsFullLoad: canEdit }),
    [canEdit, core.list.itemCount]
  );
  const { needsFullLoad, useActionFullLoad } = loadingStrategy;

  // --- List + item rows (client-owned after hydration) ---
  const [list, setList] = useState(core.list);
  const [itemInfoIds, setItemInfoIds] = useState(initialPreload.infoIds);
  const [itemInfo, setItemInfo] = useState<Record<number, ExtendedListItemInfo>>(
    initialPreload.itemMap
  );
  const [items, setItems] = useState<Record<string, ItemV2For<'card'>>>(initialPreload.items);
  const [sortInfo, setSortInfo] = useState<ListSortInfo>({
    sortBy: core.list.sortBy,
    sortDir: core.list.sortDir,
  });

  // --- Edit / selection UI ---
  const [isEdit, setEdit] = useState(false);
  const [lockSort, setLockSort] = useState(true);
  const [itemSelect, setItemSelect] = useState<number[]>([]);
  const [selectionAction, setSelectionAction] = useState<'move' | 'delete' | 'copy' | ''>('');
  const [hasChanges, setHasChangesState] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // --- Search / server filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [listStats, setListStats] = useState<SearchStats | null>(null);

  // --- Loading + async race guards ---
  const [isLoading, setLoading] = useState(needsFullLoad);
  const requestGenerationRef = useRef(0);
  const deferredLoadKeyRef = useRef<string | null>(null);
  const skipSuspenseMergeRef = useRef(false);
  const sortInfoRef = useRef(sortInfo);
  const mergeFullItemsRef = useRef<
    ((data: ListItemsData, options?: MergeListItemsOptions) => void) | null
  >(null);
  const toastRef = useRef(toast);
  const tRef = useRef(t);

  sortInfoRef.current = sortInfo;
  toastRef.current = toast;
  tRef.current = t;

  const isServerFiltered = hasServerFilters(filters);
  skipSuspenseMergeRef.current = isServerFiltered;

  const bumpRequestGeneration = useCallback(() => ++requestGenerationRef.current, []);

  const showRefreshPageError = useCallback((id: string) => {
    toastRef.current({
      id,
      title: tRef.current('General.an-error-occurred'),
      description: tRef.current('General.refreshPage'),
      status: 'error',
      duration: null,
    });
  }, []);

  /** Replace all item rows and clear edit/loading flags. */
  const applyListData = useCallback((data: ListItemsData, nextSort?: ListSortInfo) => {
    const resolvedSort = nextSort ?? sortInfoRef.current;
    setItemSelect([]);
    setSortInfo(resolvedSort);
    setItemInfoIds(data.infoIds);
    setItemInfo(data.itemMap);
    setItems(data.items);
    setHasChangesState(false);
    setLoading(false);
  }, []);

  /** Gate merges from Suspense and deferred action so stale payloads are dropped. */
  const mergeListItemsData = useCallback(
    (data: ListItemsData, options?: MergeListItemsOptions) => {
      if (
        !shouldMergeListItems(options, requestGenerationRef.current, skipSuspenseMergeRef.current)
      ) {
        return;
      }
      applyListData(data, options?.sortFromList);
    },
    [applyListData]
  );

  mergeFullItemsRef.current = mergeListItemsData;

  const mergeContext: ListFullItemsMergeContextValue = useMemo(
    () => ({
      mergeRef: mergeFullItemsRef,
      requestGenerationRef,
      skipSuspenseMergeRef,
    }),
    []
  );

  // Tier 3: client action full-load (>500 items or editor on small lists).
  useEffect(() => {
    if (!useActionFullLoad) {
      if (!needsFullLoad) {
        setLoading(false);
        deferredLoadKeyRef.current = null;
      }
      return;
    }

    const deferredLoadKey = `${locale}/${username}/${listId}`;
    if (deferredLoadKeyRef.current === deferredLoadKey) return;

    deferredLoadKeyRef.current = deferredLoadKey;
    const requestGeneration = bumpRequestGeneration();
    setLoading(true);

    loadRemainingListItems(locale, username, listId)
      .then((data) => {
        if (
          deferredLoadKeyRef.current !== deferredLoadKey ||
          requestGenerationRef.current !== requestGeneration
        ) {
          return;
        }
        mergeFullItemsRef.current?.(data, { mergeGeneration: requestGeneration });
      })
      .catch((err) => {
        console.error(err);
        if (
          deferredLoadKeyRef.current === deferredLoadKey &&
          requestGenerationRef.current === requestGeneration
        ) {
          showRefreshPageError('list-page-init-error');
        }
      });
  }, [
    bumpRequestGeneration,
    listId,
    locale,
    needsFullLoad,
    showRefreshPageError,
    useActionFullLoad,
    username,
  ]);

  const isStampList = list.officialTag.some((tag) => tag.toLowerCase() === 'stamps');
  const sortTypes = useMemo(() => buildListSortTypes(isStampList), [isStampList]);

  const displayedItemInfoIds = useMemo(
    () => filterItemInfoIdsBySearch(itemInfoIds, itemInfo, items, searchQuery),
    [itemInfo, itemInfoIds, items, searchQuery]
  );

  const hasListViewFilter = isServerFiltered || !!searchQuery.trim();

  useEffect(() => {
    if (hasListViewFilter) setLockSort(true);
  }, [hasListViewFilter]);

  const qtyCount = useMemo(
    () =>
      computeListQtyCount({
        displayedItemInfoIds,
        itemInfo,
        isLoading,
        needsFullLoad,
        isServerFiltered,
        cachedVisibleCount: list.itemCount ?? 0,
      }),
    [displayedItemInfoIds, isLoading, isServerFiltered, itemInfo, list.itemCount, needsFullLoad]
  );

  const mainItemIds = useMemo(
    () => displayedItemInfoIds.filter((id) => !itemInfo[id].isHighlight),
    [displayedItemInfoIds, itemInfo]
  );

  const selectedItems = useMemo(
    () => itemSelect.map((id) => itemInfo[id]).filter(Boolean),
    [itemInfo, itemSelect]
  );

  const refreshList = useCallback(async () => {
    const requestGeneration = bumpRequestGeneration();
    setLoading(true);
    setHasChangesState(false);
    toast.closeAll();
    setSearchQuery('');
    setFilters(defaultFilters);

    try {
      const { list: listData, items: itemData } = await refreshListData(locale, username, listId);
      if (requestGenerationRef.current !== requestGeneration) return;

      if (listData.slug && listData.slug !== listId) {
        router.replace(`/lists/${username}/${listData.slug}`);
      }

      setList(listData);
      applyListData(itemData, { sortBy: listData.sortBy, sortDir: listData.sortDir });
    } catch (err) {
      if (requestGenerationRef.current !== requestGeneration) return;
      console.error(err);
      showRefreshPageError('list-page-init-error');
      setLoading(false);
    }
  }, [
    applyListData,
    bumpRequestGeneration,
    listId,
    locale,
    router,
    showRefreshPageError,
    toast,
    username,
  ]);

  const applyFilters = useCallback(
    async (customFilters?: SearchFiltersType) => {
      const nextFilters = customFilters ?? filters;
      if (customFilters) setFilters(customFilters);

      const requestGeneration = bumpRequestGeneration();
      setLoading(true);
      setItemSelect([]);
      setItemInfoIds([]);
      setItemInfo({});
      setItems({});

      try {
        const data = await applyListFilters(locale, username, listId, nextFilters);
        if (requestGenerationRef.current !== requestGeneration) return;

        setSearchQuery('');
        applyListData(data);
      } catch (err) {
        if (requestGenerationRef.current !== requestGeneration) return;
        console.error(err);
        showRefreshPageError('list-page-filter-error');
      } finally {
        if (requestGenerationRef.current === requestGeneration) setLoading(false);
      }
    },
    [applyListData, bumpRequestGeneration, filters, listId, locale, showRefreshPageError, username]
  );

  const handleOpenFilters = useCallback(async () => {
    if (!listStats) {
      try {
        const stats = await loadListStats(locale, username, listId);
        setListStats(stats);
      } catch (err) {
        console.error(err);
      }
    }
  }, [listId, listStats, locale, username]);

  const handleSortChange = useCallback(
    (sortBy: string, sortDir: string) => {
      const resolvedDir = sortBy === 'custom' && isStampList ? 'asc' : sortDir;
      setSortInfo({ sortBy, sortDir: resolvedDir });
      setItemInfoIds(sortItemInfoIds(itemInfo, sortBy, resolvedDir, items));
      setLockSort(true);
    },
    [isStampList, itemInfo, items]
  );

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);

  const toggleEdit = useCallback(() => {
    setEdit((editing) => {
      if (editing) setItemSelect([]);
      return !editing;
    });
    setLockSort(true);
  }, []);

  const selectItem = useCallback(
    (infoId: number, force = false) => {
      if (!canEdit) return;
      if (!isEdit && !force) return;
      if (force) setEdit(true);

      setItemSelect((selected) =>
        selected.includes(infoId)
          ? selected.filter((item) => item !== infoId)
          : [...selected, infoId]
      );
    },
    [canEdit, isEdit]
  );

  const handleSelectCheckbox = useCallback(
    (checkAll: boolean) => {
      setItemSelect(checkAll ? itemInfoIds : []);
    },
    [itemInfoIds]
  );

  const handleSort = useCallback(
    (newOrder: number[]) => {
      const result = applyDragSortOrder(itemInfoIds, itemInfo, newOrder);
      if (!result) return;

      setItemInfoIds(result.itemInfoIds);
      setItemInfo(result.itemInfo);
      if (result.hasChanges) setHasChangesState(true);
    },
    [itemInfo, itemInfoIds]
  );

  const handleItemInfoChange = useCallback(
    (
      id: number,
      value: number | string | null,
      field:
        | 'amount'
        | 'capValue'
        | 'isHighlight'
        | 'isHidden'
        | 'order'
        | 'seriesStart'
        | 'seriesEnd'
    ) => {
      const newInfo = { ...itemInfo } as Record<number, ExtendedListItemInfo>;
      newInfo[id] = { ...newInfo[id] };

      if (field === 'seriesStart' || field === 'seriesEnd') {
        newInfo[id][field] = value as string | null;
      } else if (field === 'isHidden' || field === 'isHighlight') {
        newInfo[id][field] = !!value;
      } else {
        newInfo[id][field] = value as number;
      }

      newInfo[id].hasChanged = true;
      setItemInfo(newInfo);
      setHasChangesState(true);
    },
    [itemInfo]
  );

  const handleSelectedItemsBulkChange = useCallback(
    (field: 'isHidden' | 'isHighlight', value: boolean) => {
      const newInfo = { ...itemInfo };
      let changed = false;

      for (const id of itemSelect) {
        if (!newInfo[id] || newInfo[id][field] === value) continue;
        newInfo[id] = { ...newInfo[id], [field]: value, hasChanged: true };
        changed = true;
      }

      if (!changed) return;
      setItemInfo(newInfo);
      setHasChangesState(true);
    },
    [itemInfo, itemSelect]
  );

  const cntxAction = useCallback(
    (item: ItemV2For<'card'>, action: 'move' | 'delete') => {
      const infoId = itemInfoIds.find((id) => itemInfo[id].item_iid === item.internal_id);
      if (!infoId) return;
      setItemSelect([infoId]);
      setSelectionAction(action);
    },
    [itemInfoIds, itemInfo]
  );

  const saveChanges = useCallback(async () => {
    setHasChangesState(false);
    toast.closeAll();

    const x = toast({
      id: 'list-page-save-changes',
      title: `${t('General.saving-changes')}...`,
      status: 'loading',
      duration: Infinity,
    });

    const changedItems = Object.values(itemInfo).filter((item) => item.hasChanged);

    try {
      const res = await axios.post(`/api/v1/lists/${list.owner.username}/${list.internal_id}`, {
        list_id: list.internal_id,
        itemInfo: changedItems,
      });

      if (res.data.success) {
        toast.update(x, {
          id: x,
          title: t('Feedback.changes-saved'),
          status: 'success',
          duration: 5000,
        });
        setEdit(false);
        await refreshList();
      } else throw res.data.error;
    } catch (err) {
      console.error(err);
      setHasChangesState(true);
      toast.update(x, {
        id: x,
        title: t('General.an-error-occurred'),
        description: t('General.try-again-later'),
        status: 'error',
        duration: 5000,
      });
    }
  }, [itemInfo, list.internal_id, list.owner.username, refreshList, t, toast]);

  return {
    canEdit,
    isOwner: core.isOwner,
    list,
    isLoading,
    isEdit,
    lockSort,
    setLockSort,
    hasChanges,
    hasListViewFilter,
    isServerFiltered,
    isStampList,
    itemInfo,
    items,
    itemInfoIds,
    itemSelect,
    setItemSelect,
    selectionAction,
    setSelectionAction,
    openCreateModal,
    setOpenCreateModal,
    searchQuery,
    filters,
    setFilters,
    listStats,
    sortInfo,
    sortTypes,
    displayedItemInfoIds,
    mainItemIds,
    qtyCount,
    selectedItems,
    mergeContext,
    refreshList,
    applyFilters,
    handleOpenFilters,
    handleSortChange,
    handleSearch,
    toggleEdit,
    selectItem,
    handleSelectCheckbox,
    handleSort,
    handleItemInfoChange,
    handleSelectedItemsBulkChange,
    cntxAction,
    saveChanges,
  };
}
