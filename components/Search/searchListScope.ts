'use client';

import { useSyncExternalStore } from 'react';

// The search page knows which list a `list_id` search is scoped to, but the omni modal lives in
// the layout header. This tiny store lets the page publish the list so the modal can name it.
export type SearchListScope = { id: number; name: string };

let scope: SearchListScope | null = null;
const listeners = new Set<() => void>();

export const setSearchListScope = (next: SearchListScope | null) => {
  scope = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getScope = () => scope;
const getServerScope = () => null;

export const useSearchListScope = () => useSyncExternalStore(subscribe, getScope, getServerScope);
