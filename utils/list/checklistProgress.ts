import { useCallback, useSyncExternalStore } from 'react';
import type { ListItemInfo } from '@types';

export type ChecklistProgress = {
  /** Hidden rows, the same meaning the importer and the Goal Counter give them */
  collected: number;
  total: number;
};

export const computeChecklistProgress = (
  itemInfo: Record<number, Pick<ListItemInfo, 'isHidden'>>
): ChecklistProgress => {
  const rows = Object.values(itemInfo);

  return { collected: rows.filter((row) => row.isHidden).length, total: rows.length };
};

// The preference is per browser, for every checklist.
// Storage can be unavailable (private mode, blocked site data): then the progress just shows.
const HIDDEN_KEY = 'checklistProgress_hidden';

const listeners = new Set<() => void>();

function getProgressHidden() {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useChecklistProgressHidden() {
  const hidden = useSyncExternalStore(subscribe, getProgressHidden, () => false);

  const setHidden = useCallback((next: boolean) => {
    try {
      if (next) window.localStorage.setItem(HIDDEN_KEY, '1');
      else window.localStorage.removeItem(HIDDEN_KEY);
    } catch {
      // storage unavailable: the preference can't be kept
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [hidden, setHidden] as const;
}
