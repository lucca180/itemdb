import { SearchFilters } from '../types';

export const defaultFilters: SearchFilters = {
  category: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  owlsValue: ['', ''],
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  limit: 48,
  page: 1,
};

const parsableFilters = [
  'category',
  'type',
  'status',
  'color',
  'price',
  'rarity',
  'weight',
  'estVal',
  'owlsValue',
  'sortBy',
  'sortDir',
  'mode',
];

// This function will parse the query string and return an object with the filters
export const parseFilters = (query: string): [SearchFilters, string] => {
  query = query.toLowerCase();
  const filters: SearchFilters = { ...defaultFilters };
  console.log(defaultFilters);
  for (const filterName of parsableFilters) {
    if (filterName === 'category') {
      const posCategory = matchRegex(query, `cat`);
      const negCategory = matchRegex(query, `-cat`);

      query = sanitizeQuery(query, `cat`);
      query = sanitizeQuery(query, `-cat`);

      const newCategory = [];

      if (posCategory) newCategory.push(...posCategory.split(','));
      if (negCategory) newCategory.push(...negCategory.split(',').map((c) => `!${c}`));

      filters.category = newCategory;
    }

    if (filterName === 'type') {
      const posType = matchRegex(query, `type`);
      const negType = matchRegex(query, `-type`);

      query = sanitizeQuery(query, `type`);
      query = sanitizeQuery(query, `-type`);

      const newTypes = [];

      if (posType) newTypes.push(...posType.split(','));
      if (negType) newTypes.push(...negType.split(',').map((c) => `!${c}`));

      filters.type = newTypes;
    }

    if (filterName === 'status') {
      const posStatus = matchRegex(query, `status`);
      const negStatus = matchRegex(query, `-status`);

      query = sanitizeQuery(query, `status`);
      query = sanitizeQuery(query, `-status`);

      const newStatus = [];

      if (posStatus) newStatus.push(...posStatus.split(','));
      if (negStatus) newStatus.push(...negStatus.split(',').map((c) => `!${c}`));

      filters.status = newStatus;
    }

    if (filterName === 'color') {
      const color = matchRegex(query, `vibrant`);
      const negColor = matchRegex(query, `-vibrant`);

      query = sanitizeQuery(query, `vibrant`);
      query = sanitizeQuery(query, `-vibrant`);

      if (color) filters.color = color;
      else if (negColor) filters.color = `!${negColor}`;
    }

    if (filterName === 'price') {
      const minPrice = matchRegex(query, `priceMin`);
      const maxPrice = matchRegex(query, `priceMax`);

      query = sanitizeQuery(query, `priceMin`);
      query = sanitizeQuery(query, `priceMax`);

      const newPrice = [];

      if (minPrice) newPrice[0] = minPrice;
      if (maxPrice) newPrice[1] = maxPrice;

      filters.price = newPrice;
    }

    if (filterName === 'rarity') {
      const minRarity = matchRegex(query, `rarityMin`);
      const maxRarity = matchRegex(query, `rarityMax`);

      query = sanitizeQuery(query, `rarityMin`);
      query = sanitizeQuery(query, `rarityMax`);

      const newRarity = [];

      if (minRarity) newRarity[0] = minRarity;
      if (maxRarity) newRarity[1] = maxRarity;

      filters.rarity = newRarity;
    }

    if (filterName === 'weight') {
      const minWeight = matchRegex(query, `weightMin`);
      const maxWeight = matchRegex(query, `weightMax`);

      query = sanitizeQuery(query, `weightMin`);
      query = sanitizeQuery(query, `weightMax`);

      const newWeight = [];

      if (minWeight) newWeight[0] = minWeight;
      if (maxWeight) newWeight[1] = maxWeight;

      filters.weight = newWeight;
    }

    if (filterName === 'estVal') {
      const minEstVal = matchRegex(query, `estValMin`);
      const maxEstVal = matchRegex(query, `estValMax`);

      query = sanitizeQuery(query, `estValMin`);
      query = sanitizeQuery(query, `estValMax`);

      const newEstVal = [];

      if (minEstVal) newEstVal[0] = minEstVal;
      if (maxEstVal) newEstVal[1] = maxEstVal;

      filters.estVal = newEstVal;
    }

    if (filterName === 'owlsValue') {
      const minOwlsValue = matchRegex(query, `owlsMin`);
      const maxOwlsValue = matchRegex(query, `owlsMax`);

      query = sanitizeQuery(query, `owlsMin`);
      query = sanitizeQuery(query, `owlsMax`);

      const newOwlsValue = [];

      if (minOwlsValue) newOwlsValue[0] = minOwlsValue;
      if (maxOwlsValue) newOwlsValue[1] = maxOwlsValue;

      filters.owlsValue = newOwlsValue;
    }

    if (filterName === 'sortBy') {
      const sortBy = matchRegex(query, `sortBy`);

      query = sanitizeQuery(query, `sortBy`);

      if (sortBy) filters.sortBy = sortBy;
    }

    if (filterName === 'sortDir') {
      const sortDir = matchRegex(query, `sortDir`);

      query = sanitizeQuery(query, `sortDir`);

      if (sortDir) filters.sortDir = sortDir;
    }

    if (filterName === 'mode') {
      const mode = matchRegex(query, `mode`);

      query = sanitizeQuery(query, `mode`);

      if (mode && ['name', 'description', 'all'].includes(mode))
        filters.mode = mode as 'name' | 'description' | 'all';
    }
  }

  const newQuery = query.split(' ').map((q) => {
    q = q.trim();

    if (!q) return q;

    if (!q.startsWith('-') && !q.startsWith('+') && !q.startsWith('#')) return `+${q}`;
    else return q;
  });

  return [filters, newQuery.join(' ')];
};

const matchRegex = (query: string, filterName: string): string | null => {
  const regex = new RegExp(`(${filterName}):("([^"]*)"|(\\S+))`, 'gi');

  const match = regex.exec(query);
  if (!match) return null;
  const [, , result] = match;

  return result.replaceAll('"', '');
};

const sanitizeQuery = (query: string, filterName: string): string => {
  const regex = new RegExp(`(${filterName}):("([^"]*)"|(\\S+))`, 'gi');

  const match = regex.exec(query);
  if (!match) return query;

  const [result] = match;

  return query.replace(result, '');
};
