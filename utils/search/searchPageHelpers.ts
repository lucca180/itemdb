import { SearchFilters } from '../../types';
import { getFiltersDiff } from '../parseFilters';

export const shouldUpdateCount = (newFilter: SearchFilters, prevFilter: SearchFilters | null) => {
  const diff = getFiltersDiff(newFilter, prevFilter ?? undefined);
  const keys = Object.keys(diff) as (keyof SearchFilters)[];
  const dontUpdateCountKeys = ['page', 'limit', 'sortDir', 'sortBy'];

  return keys.some((key) => !dontUpdateCountKeys.includes(key));
};

export const isCanceledSearchError = (err: any) =>
  err?.status === 499 || err?.code === 'ERR_CANCELED';
