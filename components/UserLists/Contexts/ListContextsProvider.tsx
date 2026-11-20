'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ListContext } from '@types';
import { contextShowsBadge } from '@utils/list/listContexts';

type ListContextsValue = {
  byIid: Map<number, ListContext[]>;
  /** Context already shown by the enclosing group header */
  excludeId?: number;
  onSeeAll?: (contextId: number) => void;
};

const ListContextsReactContext = createContext<ListContextsValue | null>(null);

const EMPTY: ListContext[] = [];

export function groupContextsByItem(contexts: ListContext[]) {
  const byIid = new Map<number, ListContext[]>();
  for (const context of contexts) {
    for (const iid of context.itemIids) {
      const current = byIid.get(iid);
      if (current) current.push(context);
      else byIid.set(iid, [context]);
    }
  }
  return byIid;
}

/**
 * Makes the list contexts available to the item cards rendered below it. Grouping-only contexts
 * are left out: they never show in an item card corner.
 */
export function ListContextsProvider({
  contexts,
  onSeeAll,
  children,
}: {
  contexts: ListContext[];
  onSeeAll?: (contextId: number) => void;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ byIid: groupContextsByItem(contexts.filter(contextShowsBadge)), onSeeAll }),
    [contexts, onSeeAll]
  );

  return (
    <ListContextsReactContext.Provider value={value}>{children}</ListContextsReactContext.Provider>
  );
}

/** Inside a context group: cards skip the group's own context. */
export function ListContextGroupProvider({
  contextId,
  children,
}: {
  contextId: number;
  children: ReactNode;
}) {
  const parent = useContext(ListContextsReactContext);
  const value = useMemo(
    () => (parent ? { ...parent, excludeId: contextId } : null),
    [parent, contextId]
  );

  return (
    <ListContextsReactContext.Provider value={value}>{children}</ListContextsReactContext.Provider>
  );
}

/** Contexts of one item, or an empty array outside a provider. */
export function useItemListContexts(itemIid: number | undefined) {
  const value = useContext(ListContextsReactContext);

  const contexts = useMemo(() => {
    if (!value || itemIid === undefined) return EMPTY;
    const all = value.byIid.get(itemIid) ?? EMPTY;
    return value.excludeId === undefined
      ? all
      : all.filter((context) => context.internal_id !== value.excludeId);
  }, [value, itemIid]);

  return { contexts, onSeeAll: value?.onSeeAll };
}
