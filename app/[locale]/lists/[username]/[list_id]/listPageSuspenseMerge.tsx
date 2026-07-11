'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { ListItemsData } from './listPage';
import type { MergeListItemsOptions } from './listPageStateHelpers';

export type ListFullItemsMergeContextValue = {
  mergeRef: React.MutableRefObject<
    ((data: ListItemsData, options?: MergeListItemsOptions) => void) | null
  >;
  requestGenerationRef: React.MutableRefObject<number>;
  skipSuspenseMergeRef: React.MutableRefObject<boolean>;
};

const ListFullItemsMergeContext = createContext<ListFullItemsMergeContextValue | null>(null);

/**
 * Receives the Suspense full-load payload from the server and merges it into client state.
 * Generation is frozen on first effect run so later filter/refresh requests cannot be overwritten.
 */
export function ListFullItemsReceiver({ data }: { data: ListItemsData }) {
  const mergeContext = useContext(ListFullItemsMergeContext);
  const appliedDataRef = useRef<ListItemsData | null>(null);
  const suspenseMergeGenerationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mergeContext) return;

    if (suspenseMergeGenerationRef.current === null) {
      suspenseMergeGenerationRef.current = mergeContext.requestGenerationRef.current;
    }

    if (mergeContext.skipSuspenseMergeRef.current) return;
    if (appliedDataRef.current === data) return;

    const mergeGeneration = suspenseMergeGenerationRef.current;
    if (mergeGeneration === null) return;
    if (mergeContext.requestGenerationRef.current !== mergeGeneration) return;

    appliedDataRef.current = data;
    mergeContext.mergeRef.current?.(data, { mergeGeneration, fromSuspense: true });
  }, [data, mergeContext]);

  return null;
}

export function ListFullItemsMergeProvider({
  value,
  children,
}: {
  value: ListFullItemsMergeContextValue;
  children: ReactNode;
}) {
  return (
    <ListFullItemsMergeContext.Provider value={value}>
      {children}
    </ListFullItemsMergeContext.Provider>
  );
}

/** Stable context object — refs are mutable and safe to reuse across renders. */
export function useListFullItemsMergeContext(
  mergeRef: ListFullItemsMergeContextValue['mergeRef'],
  requestGenerationRef: ListFullItemsMergeContextValue['requestGenerationRef'],
  skipSuspenseMergeRef: ListFullItemsMergeContextValue['skipSuspenseMergeRef']
): ListFullItemsMergeContextValue {
  return useMemo(
    () => ({
      mergeRef,
      requestGenerationRef,
      skipSuspenseMergeRef,
    }),
    [mergeRef, requestGenerationRef, skipSuspenseMergeRef]
  );
}
