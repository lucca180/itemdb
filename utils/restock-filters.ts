import { defaultFilters } from '@utils/parseFilters';
import { NORMAL_SHOP_RESTOCK_RARITY_MAX, shopIDToCategory } from '@utils/utils';
import type { SearchFilters } from '@types';

const INITIAL_MIN_PROFIT = 1000;

export { INITIAL_MIN_PROFIT };

export const RESTOCK_FILTER = (shopId: string | number): SearchFilters => ({
  ...defaultFilters,
  restockProfit: INITIAL_MIN_PROFIT.toString(),
  category: [shopIDToCategory[shopId]],
  rarity: ['1', (NORMAL_SHOP_RESTOCK_RARITY_MAX - 1).toString()],
  limit: 10000,
  sortBy: 'price',
  sortDir: 'desc',
  status: ['active'],
  restockIncludeUnpriced: true,
});
