import { useSyncExternalStore } from 'react';

/**
 * Last list the user imported into (per browser), offered as a shortcut when the import
 * has no recommended list. Storage can be unavailable (private mode, blocked site data).
 */
const LAST_IMPORT_LIST_KEY = 'importV2_lastListId';

function getLastImportListId(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_IMPORT_LIST_KEY));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function setLastImportListId(listId: number) {
  try {
    window.localStorage.setItem(LAST_IMPORT_LIST_KEY, String(listId));
  } catch {
    // storage unavailable: the shortcut just won't show next time
  }
}

// the value only changes after a successful import, which navigates away
const subscribe = () => () => {};

/** Last imported list id; `null` on the server and when nothing is stored. */
export function useLastImportListId() {
  return useSyncExternalStore(subscribe, getLastImportListId, () => null);
}
