import axios from 'axios';
import { expect, test, describe } from 'vitest';
import { doSearch } from '../pages/api/v1/search';
import { SearchFilters } from '@types';
import { RESTOCK_FILTER } from '../pages/restock/[id]';

const itemdb = axios.create({
  baseURL: 'http://itemdb.com.br/api/v1/',
  headers: {
    'x-tarnum-skip': process.env.TARNUM_KEY || '',
  },
});

type QueryType = Partial<SearchFilters> & { [key: string]: any };

const collectiblesQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: ['collectible'],
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
  petpetOnlyPaintable: false,
  restockIncludeUnpriced: false,
};

const bookListQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: ['canRead'],
  zone: [],
  color: '',
  limit: 48,
  price: ['', ''],
  estVal: ['', ''],
  rarity: ['', ''],
  sortBy: 'name',
  status: [],
  weight: ['', ''],
  sortDir: 'asc',
  category: ['!Booktastic Book'],
  colorType: 'vibrant',
  owlsValue: ['', ''],
  petpetColor: [],
  petpetSpecies: [],
  restockProfit: '',
  colorTolerance: '750',
  petpetOnlyPaintable: false,
  restockIncludeUnpriced: false,
};

const gourmetFoodQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: ['canEat'],
  color: '',
  limit: 48,
  price: ['', ''],
  estVal: ['', ''],
  rarity: ['90', '100'],
  sortBy: 'name',
  status: [],
  weight: ['', ''],
  sortDir: 'asc',
  category: [],
  owlsValue: ['', ''],
  restockProfit: '',
};

const premiumCollectiblesQuery: QueryType = {
  s: 'premium collectible:',
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
  sortDir: 'asc',
  category: [],
  colorType: 'vibrant',
  owlsValue: ['', ''],
  restockProfit: '',
  colorTolerance: '750',
};

const premiumQuestQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: [],
  zone: [],
  color: '',
  limit: 48,
  price: ['', ''],
  estVal: ['', ''],
  //@ts-expect-error DB is like this
  rarity: [88, 88],
  sortBy: 'name',
  status: ['active', 'no trade'],
  weight: ['', ''],
  sortDir: 'asc',
  category: [],
  colorType: 'vibrant',
  owlsValue: ['', ''],
  petpetColor: [],
  petpetSpecies: [],
  restockProfit: '',
  colorTolerance: '750',
  petpetOnlyPaintable: false,
  restockIncludeUnpriced: false,
};

const neodeckQuery: QueryType = {
  s: '',
  mode: 'name',
  page: 1,
  type: [],
  color: '',
  limit: 48,
  price: ['', ''],
  estVal: ['', ''],
  rarity: ['', ''],
  sortBy: 'name',
  status: [],
  weight: ['', ''],
  sortDir: 'asc',
  category: ['collectable card'],
  owlsValue: ['', ''],
  restockProfit: '',
};

const blumarooQuery: QueryType = {
  category: [],
  zone: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  ncValue: ['', ''],
  petpetColor: [],
  petpetSpecies: [-2],
  restockProfit: '',
  restockIncludeUnpriced: false,
  colorTolerance: '750',
  colorType: 'vibrant',
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  list_id: 0,
  limit: 4000,
  page: 0,
  s: 'fire',
};

const angelpussQuery: QueryType = {
  category: [],
  zone: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  ncValue: ['', ''],
  petpetColor: [],
  petpetSpecies: [8, 1024],
  restockProfit: '',
  restockIncludeUnpriced: false,
  colorTolerance: '750',
  colorType: 'vibrant',
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  list_id: 0,
  limit: 48,
  page: 1,
  s: '',
};

const alienQuery: QueryType = {
  category: [],
  zone: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  ncValue: ['', ''],
  petpetColor: [1007],
  petpetSpecies: [],
  restockProfit: '',
  restockIncludeUnpriced: false,
  colorTolerance: '750',
  colorType: 'vibrant',
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  list_id: 0,
  limit: 48,
  page: 1,
  s: '',
};

describe('Search API tests', () => {
  test.concurrent.each([
    { query: bookListQuery, description: 'Book List Search' },
    { query: collectiblesQuery, description: 'Collectibles Search' },
    { query: gourmetFoodQuery, description: 'Gourmet Food Search' },
    { query: premiumCollectiblesQuery, description: 'Premium Collectibles Search' },
    { query: premiumQuestQuery, description: 'Premium Quest Search' },
    { query: neodeckQuery, description: 'Neodeck Search' },
    { query: RESTOCK_FILTER(1) as QueryType, description: 'Fresh Foods Restock Search' },
    { query: blumarooQuery, description: 'Blumaroo Fire Avatar Search' },
    { query: angelpussQuery, description: 'Angelpuss Avatar Search' },
    { query: alienQuery, description: 'Alien Petpet Search' },
  ])('$description', async ({ query }) => {
    const itemdbAPI = itemdb.get('/search', {
      params: {
        ...query,
        limit: 1,
        onlyStats: true,
      },
    });

    const candidateAPI = doSearch(
      query.s ?? '',
      query as SearchFilters,
      false,
      undefined,
      undefined,
      true
    );

    const [itemdbResponse, candidateResponse] = await Promise.all([itemdbAPI, candidateAPI]);

    expect(itemdbResponse.status).toBe(200);
    const data = itemdbResponse.data as Awaited<ReturnType<typeof doSearch>>;
    expect(data.totalResults).toEqual(candidateResponse.totalResults);
  });
});
