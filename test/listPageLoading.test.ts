import { describe, expect, it } from 'vitest';
import {
  getListLoadingStrategy,
  LIST_FULL_SERVER_LOAD_THRESHOLD,
  LIST_PRELOAD_LIMIT,
} from '@app/[locale]/lists/[username]/[list_id]/listPage';

describe('list page loading strategy', () => {
  it('uses only the preload when the list fits within the preload limit', () => {
    expect(getListLoadingStrategy(LIST_PRELOAD_LIMIT)).toEqual({
      needsFullLoad: false,
      useSuspenseFullLoad: false,
      useDeferredFullLoad: false,
      useActionFullLoad: false,
    });
  });

  it('uses only the preload for small lists', () => {
    expect(getListLoadingStrategy(12)).toEqual({
      needsFullLoad: false,
      useSuspenseFullLoad: false,
      useDeferredFullLoad: false,
      useActionFullLoad: false,
    });
  });

  it('uses action full load for editors on small lists', () => {
    expect(getListLoadingStrategy(12, { editorNeedsFullLoad: true })).toEqual({
      needsFullLoad: true,
      useSuspenseFullLoad: false,
      useDeferredFullLoad: false,
      useActionFullLoad: true,
    });
  });

  it('uses Suspense for medium lists above the preload limit', () => {
    expect(getListLoadingStrategy(100)).toEqual({
      needsFullLoad: true,
      useSuspenseFullLoad: true,
      useDeferredFullLoad: false,
      useActionFullLoad: false,
    });
  });

  it('uses deferred loading above the server threshold', () => {
    expect(getListLoadingStrategy(LIST_FULL_SERVER_LOAD_THRESHOLD + 1)).toEqual({
      needsFullLoad: true,
      useSuspenseFullLoad: false,
      useDeferredFullLoad: true,
      useActionFullLoad: true,
    });
  });

  it('uses deferred loading for very large lists', () => {
    expect(getListLoadingStrategy(600)).toEqual({
      needsFullLoad: true,
      useSuspenseFullLoad: false,
      useDeferredFullLoad: true,
      useActionFullLoad: true,
    });
  });
});
