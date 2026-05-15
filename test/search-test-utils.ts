import axios from 'axios';
import { SearchFilters } from '@types';
import { RESTOCK_FILTER } from '../pages/restock/[id]';

export const itemdb = axios.create({
  baseURL: 'http://itemdb.com.br/api/v1/',
  headers: {
    'x-tarnum-skip': process.env.TARNUM_KEY || '',
  },
});

export type QueryType = Partial<Omit<SearchFilters, 'p2Paintable' | 'p2Canonical'>> & {
  s: string;
  p2Paintable?: boolean | 'true' | 'false';
  p2Canonical?: boolean | 'true' | 'false';
  owlsValue?: string[];
  petpetOnlyPaintable?: boolean;
};

export type SearchCase = {
  description: string;
  query: QueryType;
};

export type SearchStatsCase = {
  description: string;
  query: string;
  statsParams?: {
    forceCategory?: string;
    isRestock?: boolean;
  };
  searchFilters?: Partial<SearchFilters>;
};

export const asSearchFilters = (query: QueryType | Partial<SearchFilters> | undefined) =>
  query as SearchFilters | undefined;

const baseQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: [],
  zone: [],
  color: '',
  limit: 48,
  price: ['', ''],
  estVal: ['', ''],
  rarity: ['', ''],
  sortBy: 'name',
  status: [],
  weight: ['', ''],
  ncValue: ['', ''],
  sortDir: 'asc',
  category: [],
  colorType: 'vibrant',
  petpetColor: [],
  petpetSpecies: [],
  restockProfit: '',
  colorTolerance: '750',
  restockIncludeUnpriced: false,
};

const collectiblesQuery: QueryType = {
  ...baseQuery,
  type: ['collectible'],
  petpetOnlyPaintable: false,
};

const bookListQuery: QueryType = {
  ...baseQuery,
  type: ['canRead'],
  category: ['!Booktastic Book'],
  owlsValue: ['', ''],
  petpetOnlyPaintable: false,
};

const gourmetFoodQuery: QueryType = {
  ...baseQuery,
  type: ['canEat'],
  rarity: ['90', '100'],
  owlsValue: ['', ''],
};

const premiumCollectiblesQuery: QueryType = {
  ...baseQuery,
  s: 'premium collectible:',
  owlsValue: ['', ''],
};

const premiumQuestQuery: QueryType = {
  ...baseQuery,
  rarity: ['88', '88'],
  status: ['active', 'no trade'],
  owlsValue: ['', ''],
  petpetOnlyPaintable: false,
};

const neodeckQuery: QueryType = {
  ...baseQuery,
  category: ['collectable card'],
  owlsValue: ['', ''],
};

export const blumarooQuery: QueryType = {
  ...baseQuery,
  petpetSpecies: [-2],
  limit: 4000,
  page: 0,
  s: 'fire',
};

export const angelpussQuery: QueryType = {
  ...baseQuery,
  petpetSpecies: [8, 1024],
};

const alienQuery: QueryType = {
  ...baseQuery,
  petpetColor: [1007],
};

export const colorSearchQuery: QueryType = {
  ...baseQuery,
  s: '#ff0000',
  sortBy: 'color',
};

export const colorFilterQuery: QueryType = {
  ...baseQuery,
  color: '#ff0000',
  sortBy: 'color',
};

const negativeColorFilterQuery: QueryType = {
  ...baseQuery,
  color: '!#ff0000',
  limit: 24,
};

export const zoneFilterQuery: QueryType = {
  ...baseQuery,
  type: ['wearable'],
  zone: ['background item'],
};

const descriptionModeQuery: QueryType = {
  ...baseQuery,
  s: 'apple',
  mode: 'description',
};

const allModeQuery: QueryType = {
  ...baseQuery,
  s: 'snow faerie',
  mode: 'all',
};

const notModeQuery: QueryType = {
  ...baseQuery,
  s: 'paint brush',
  mode: 'not',
  limit: 24,
};

export const saleStatusQuery: QueryType = {
  ...baseQuery,
  type: ['ets'],
};

const negativeTypeQuery: QueryType = {
  ...baseQuery,
  type: ['!wearable', '!neohome', '!battledome'],
};

const petpetPaintableQuery: QueryType = {
  ...baseQuery,
  petpetSpecies: [-2],
  p2Paintable: 'true',
};

const petpetCanonicalQuery: QueryType = {
  ...baseQuery,
  petpetSpecies: [-2],
  p2Canonical: 'true',
};

export const paginationQuery: QueryType = {
  ...baseQuery,
  s: 'faerie',
  page: 2,
  limit: 12,
  sortBy: 'price',
  sortDir: 'desc',
};

export const productionComparisonCases: SearchCase[] = [
  { query: bookListQuery, description: 'Book List Search' },
  { query: collectiblesQuery, description: 'Collectibles Search' },
  { query: gourmetFoodQuery, description: 'Gourmet Food Search' },
  { query: premiumCollectiblesQuery, description: 'Premium Collectibles Search' },
  { query: premiumQuestQuery, description: 'Premium Quest Search' },
  { query: neodeckQuery, description: 'Neodeck Search' },
  { query: { ...RESTOCK_FILTER(1), s: '' }, description: 'Fresh Foods Restock Search' },
  { query: blumarooQuery, description: 'Blumaroo Fire Avatar Search' },
  { query: angelpussQuery, description: 'Angelpuss Avatar Search' },
  { query: alienQuery, description: 'Alien Petpet Search' },
  { query: colorSearchQuery, description: 'Color Search' },
  { query: colorFilterQuery, description: 'Color Filter Search' },
  { query: negativeColorFilterQuery, description: 'Negative Color Filter Search' },
  { query: zoneFilterQuery, description: 'Wearable Zone Search' },
  { query: descriptionModeQuery, description: 'Description Mode Search' },
  { query: allModeQuery, description: 'All Mode Search' },
  { query: notModeQuery, description: 'Not Mode Search' },
  { query: saleStatusQuery, description: 'Sale Status Search' },
  { query: negativeTypeQuery, description: 'Negative Type Search' },
  { query: petpetPaintableQuery, description: 'Petpet Paintable Search' },
  { query: petpetCanonicalQuery, description: 'Petpet Canonical Search' },
];

export const consistentPageCases: SearchCase[] = [
  { query: colorSearchQuery, description: 'Color Search' },
  { query: colorFilterQuery, description: 'Color Filter Search' },
  { query: zoneFilterQuery, description: 'Wearable Zone Search' },
  { query: angelpussQuery, description: 'Petpet Species Search' },
  { query: saleStatusQuery, description: 'Sale Status Search' },
  { query: paginationQuery, description: 'Paginated Search' },
];

export const searchStatsCases: SearchStatsCase[] = [
  { description: 'empty search', query: '' },
  { description: 'name search', query: 'paint brush' },
  { description: 'filtered query search', query: 'premium collectible:' },
  { description: 'color search', query: '#ff0000' },
  {
    description: 'restock shop search',
    query: '',
    statsParams: { forceCategory: 'food', isRestock: true },
    searchFilters: { category: ['food'], rarity: ['', '100'] },
  },
];

export function sumStats(stats: Record<string, number>) {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}
