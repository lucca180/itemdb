import { SearchFilters } from '../types';

export const defaultFilters: SearchFilters = {
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
  petpetSpecies: [],
  p2Paintable: undefined,
  p2Canonical: undefined,
  restockProfit: '',
  restockIncludeUnpriced: false,
  colorTolerance: '750',
  colorType: 'vibrant',
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  limit: 48,
  page: 1,
};

const parsableFilters = [
  'category',
  'zone',
  'type',
  'status',
  'color',
  'price',
  'rarity',
  'weight',
  'estVal',
  'ncValue',
  'sortBy',
  'sortDir',
  'mode',
  'colorTolerance',
  'colorType',
];

// This function will parse the query string and return an object with the filters
export const parseFilters = (query: string, skipBoolean = true): [SearchFilters, string] => {
  query = query.toLowerCase();
  const filters: SearchFilters = { ...defaultFilters };

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

    if (filterName === 'zone') {
      const posCategory = matchRegex(query, `zone`);
      const negCategory = matchRegex(query, `-zone`);

      query = sanitizeQuery(query, `zone`);
      query = sanitizeQuery(query, `-zone`);

      const newZone = [];

      if (posCategory) newZone.push(...posCategory.split(','));
      if (negCategory) newZone.push(...negCategory.split(',').map((c) => `!${c}`));

      filters.zone = newZone;
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

    if (filterName === 'ncValue') {
      const minNcValue = matchRegex(query, `ncValueMin`);
      const maxNcValue = matchRegex(query, `ncValueMax`);

      query = sanitizeQuery(query, `ncValueMin`);
      query = sanitizeQuery(query, `ncValueMax`);

      const newNcValue = [];

      if (minNcValue) newNcValue[0] = minNcValue;
      if (maxNcValue) newNcValue[1] = maxNcValue;

      filters.ncValue = newNcValue;
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

      if (mode && ['name', 'description', 'all', 'not'].includes(mode))
        filters.mode = mode as 'name' | 'description' | 'all' | 'not';
    }

    if (filterName === 'colorTolerance') {
      const tolerance = matchRegex(query, `tolerance`);

      query = sanitizeQuery(query, `tolerance`);

      if (tolerance) filters.colorTolerance = tolerance;
    }

    if (filterName === 'colorType') {
      const colorType = matchRegex(query, `colorType`);

      query = sanitizeQuery(query, `colorType`);

      if (colorType) filters.colorType = colorType;
    }
  }

  if (!query.match(/^#[0-9A-Fa-f]{6}$/) && query.match(/#[0-9A-Fa-f]{6}/)) {
    const hex = query.match(/#[0-9A-Fa-f]{6}/)?.[0];
    if (hex) {
      query = query.replaceAll(/#[0-9A-Fa-f]{6}/g, '');
      filters.color = hex;
    }
  }

  const newQuery = skipBoolean ? query : addPlusToWords(query);

  return [filters, newQuery];
};

const matchRegex = (query: string, filterName: string): string | null => {
  // const regex = new RegExp(`(${filterName}):("([^"]*)"|(\\S+))`, 'gi');
  const regex = new RegExp(`(\\s|^)(${filterName}):(([^\\s"])|("([^"]*)"))+`, 'gi');

  const match = regex.exec(query);
  if (!match) return null;

  const result = match[0].replace(`${filterName}:`, '');

  return result.replaceAll('"', '').trim();
};

const sanitizeQuery = (query: string, filterName: string): string => {
  const regex = new RegExp(`(\\s|^)(${filterName}):(([^\\s"])|("([^"]*)"))+`, 'gi');

  const match = regex.exec(query);
  if (!match) return query;

  const [result] = match;

  return query.replace(result, '').trim();
};

const shouldAddPlusPrefix = (str: string): boolean => {
  // Check if a string meets the criteria for adding the '+' prefix
  return (
    !str.startsWith('-') &&
    !str.startsWith('+') &&
    !str.startsWith('#') &&
    !str.startsWith('@') &&
    !str.startsWith('<') &&
    !str.startsWith('>') &&
    !str.startsWith('~') &&
    !str.startsWith('!') &&
    !str.startsWith('*') &&
    !str.startsWith(')')
  );
};

function addPlusToWords(input: string): string {
  input = removeInvalidParentheses(input);

  if (input.endsWith('-') || input.endsWith('+')) input = input.slice(0, -1);
  else if (input.endsWith('-"') || input.endsWith('+"')) input = input.slice(0, -2) + '"';

  input = input.replaceAll('+-', '-');
  input = input.replaceAll('-+', '+');
  input = input.replaceAll('++', '+');
  input = input.replaceAll('--', '-');

  if (input.includes('@') && !input.includes('@distance')) input = input.replaceAll('@', '');

  input = input.replaceAll(/(?<=.)[-+](?=\s)/gim, '');

  let result = '';
  let isInQuotes = false;
  let isInParentheses = 0;
  let lastWasEmpty = true;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      isInQuotes = !isInQuotes;
    }

    if (!isInQuotes) {
      if (char === '(') {
        isInParentheses++;
      } else if (char === ')') {
        isInParentheses--;
      }

      if (
        (!isInParentheses || (isInParentheses === 1 && char === '(')) &&
        lastWasEmpty &&
        shouldAddPlusPrefix(char) &&
        checkWord(input, i)
      ) {
        result += '+' + char;
      } else {
        result += char;
      }
    } else {
      result += char;
    }

    if (char === ' ') {
      lastWasEmpty = true;
    } else {
      lastWasEmpty = false;
    }
  }

  return result;
}

// adding "+" to these words will cause the search to fail
const stopwords = [
  'a',
  'about',
  'an',
  'are',
  'as',
  'at',
  'be',
  'by',
  'com',
  'de',
  'en',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'la',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'what',
  'when',
  'where',
  'who',
  'will',
  'with',
  'und',
  'the',
  'www',
];

// check if a word is a stopword or has less than 3 characters
const checkWord = (input: string, startIndex: number): boolean => {
  let word = '';

  for (let i = startIndex; i < input.length; i++) {
    const char = input[i];

    if (char === ' ') {
      break;
    }

    word += char;
  }

  return !stopwords.includes(word) && word.length > 2;
};

function removeInvalidParentheses(s: string) {
  // Helper function to check if a string is valid
  function isValid(str: string) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') {
        count++;
      } else if (str[i] === ')') {
        count--;
        if (count < 0) {
          return false;
        }
      }
    }
    return count === 0;
  }

  // Initialize a queue for BFS (Breadth-First Search)
  const queue = [s];
  const visited = new Set();
  visited.add(s);

  while (queue.length > 0) {
    const current = queue.shift() ?? '';

    if (isValid(current)) {
      return current;
    }

    // Generate all possible strings by removing one character at a time
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== '(' && current[i] !== ')') {
        continue; // Ignore characters that are not parentheses
      }

      const next = current.slice(0, i) + current.slice(i + 1);

      if (!visited.has(next)) {
        queue.push(next);
        visited.add(next);
      }
    }
  }

  return s;
}
