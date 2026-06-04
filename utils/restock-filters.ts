import { defaultFilters } from '@utils/parseFilters';
import { shopIDToCategory } from '@utils/utils';
import type { SearchFilters } from '@types';

const INITIAL_MIN_PROFIT = 1000;

export { INITIAL_MIN_PROFIT };

export const RESTOCK_FILTER = (shopId: string | number): SearchFilters => ({
  ...defaultFilters,
  restockProfit: INITIAL_MIN_PROFIT.toString(),
  category: [shopIDToCategory[shopId]],
  rarity: ['1', '100'],
  limit: 10000,
  sortBy: 'price',
  sortDir: 'desc',
  status: ['active'],
  restockIncludeUnpriced: true,
});
