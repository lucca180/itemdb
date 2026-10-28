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
  // Empty = "no explicit choice": queryBuilder.ts falls back to the item's own accent color
  // (ITEM_COLOR_TYPE, following ITEM_COLOR_SOURCE) instead of a hardcoded named swatch. A
  // real value here (e.g. 'vibrant') only happens when the user picks one from the dropdown.
  colorType: '',
  sortBy: 'name',
  sortDir: 'asc',
  mode: 'name',
  list_id: 0,
  limit: 48,
  page: 1,
};

// `cat:food -cat:toy` → category: ['food', '!toy']
const listFilters = {
  category: 'cat',
  zone: 'zone',
  type: 'type',
  status: 'status',
} as const;

// `priceMin:1000 priceMax:5000` → price: ['1000', '5000']
const rangeFilters = ['price', 'rarity', 'weight', 'estVal', 'ncValue'] as const;

// queryBuilder compares these case-sensitively ('estVal', 'ncValue')
const sortByValues = [
  'name',
  'price',
  'added',
  'ncValue',
  'color',
  'weight',
  'estVal',
  'id',
  'rarity',
  'match',
];

const modeValues = ['name', 'description', 'all', 'not', 'boolean', 'natural', 'fuzzy'] as const;

// This function will parse the query string and return an object with the filters
export const parseFilters = (query: string, skipBoolean = true): [SearchFilters, string] => {
  const filters: SearchFilters = { ...defaultFilters };

  // removes every `name:value` / `name:"some value"` occurrence and returns their values
  const take = (filterName: string) => {
    const [values, rest] = extractFilter(query, filterName);
    query = rest;
    return values;
  };

  for (const filterName of Object.keys(listFilters) as (keyof typeof listFilters)[]) {
    const alias = listFilters[filterName];
    const pos = take(alias).flatMap((v) => v.split(','));
    const neg = take(`-${alias}`).flatMap((v) => v.split(','));

    filters[filterName] = [...pos, ...neg.map((c) => `!${c}`)];
  }

  const [color] = take('vibrant');
  const [negColor] = take('-vibrant');
  if (color) filters.color = color;
  else if (negColor) filters.color = `!${negColor}`;

  for (const filterName of rangeFilters) {
    const [min] = take(`${filterName}Min`);
    const [max] = take(`${filterName}Max`);

    // stays [] when absent so queryBuilder skips the price/owls joins
    filters[filterName] = min || max ? [min ?? '', max ?? ''] : [];
  }

  const [sortBy] = take('sortBy');
  if (sortBy) filters.sortBy = sortByValues.find((v) => v.toLowerCase() === sortBy) ?? sortBy;

  const [sortDir] = take('sortDir');
  if (sortDir) filters.sortDir = sortDir;

  const [mode] = take('mode');
  if (mode && (modeValues as readonly string[]).includes(mode))
    filters.mode = mode as (typeof modeValues)[number];

  const [tolerance] = take('tolerance');
  if (tolerance) filters.colorTolerance = tolerance;

  const [colorType] = take('colorType');
  if (colorType) filters.colorType = colorType;

  query = query.toLowerCase();

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

const extractFilter = (query: string, filterName: string): [string[], string] => {
  const regex = new RegExp(`(\\s|^)${filterName}:((?:[^\\s"]|"[^"]*")+)`, 'gi');
  const values: string[] = [];

  const rest = query.replace(regex, (_, __, value: string) => {
    values.push(value.replaceAll('"', '').trim().toLowerCase());
    return '';
  });

  return [values, rest.trim()];
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
  input = removeInvalidOperators(input);
  input = removeInvalidParentheses(input);
  input = quoteHyphenatedWords(input);

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
    } else if (char === '"' && !isInParentheses && lastWasEmpty && checkPhrase(input, i)) {
      result += '+' + char;
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
const stopwords = new Set([
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
  'www',
]);

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

  return !stopwords.has(word) && word.length > 2;
};

// a required phrase made only of stopwords or short words ("of the", "5-in-1") matches nothing
const checkPhrase = (input: string, quoteIndex: number): boolean => {
  const end = input.indexOf('"', quoteIndex + 1);
  const phrase = input.slice(quoteIndex + 1, end === -1 ? undefined : end);

  return phrase.split(/[^\p{L}\p{N}]+/u).some((word) => word.length > 2 && !stopwords.has(word));
};

// InnoDB reads "+hand-painted" as "+hand -painted", so hyphenated words become phrases.
// Phrases can't be truncated, so "hand-pai*" is split into words instead.
function quoteHyphenatedWords(input: string) {
  return input.replace(/"[^"]*"|[^\s"()]+/g, (token) => {
    if (token.startsWith('"')) return token;

    const match = token.match(/^([-+~<>]?)(\S*[\p{L}\p{N}]-[\p{L}\p{N}]\S*)$/u);
    if (!match) return token;

    const [, prefix, word] = match;
    if (word.endsWith('*'))
      return word
        .split('-')
        .filter(Boolean)
        .map((part) => prefix + part)
        .join(' ');

    return `${prefix}"${word}"`;
  });
}

// Drops operators that InnoDB's boolean-mode parser rejects (error 1064), e.g. "* foo", "foo ~", "~+foo".
function removeInvalidOperators(input: string) {
  // an unmatched quote would swallow the rest of the query
  if ((input.match(/"/g)?.length ?? 0) % 2 === 1) {
    const last = input.lastIndexOf('"');
    input = input.slice(0, last) + input.slice(last + 1);
  }

  // '@N' is only valid as a proximity operator right after a phrase: "foo bar" @3
  input = input.replace(/("[^"]*")\s*@(\d+)|@\d*/g, (_, phrase?: string, distance?: string) =>
    phrase ? `${phrase} @${distance}` : ''
  );

  // '*' is only valid as a truncation operator right after a word
  input = input.replace(/(?<=^|[\s"()+\-<>~@%*])\*+/g, '');

  // tokens made only of operators/punctuation ("-", "~", "()", ...)
  input = input.replace(/(^|\s)[^\p{L}\p{N}\s"]+(?=\s|$)/gu, '$1');

  // stacked prefixes ("~+foo" -> "+foo") and prefixes with nothing after them ("foo~")
  input = input.replace(/[-+~<>]+(?=[-+~<>])/g, '');
  input = input.replace(/(?<=\S)[-+~<>]+(?=[\s)]|$)/g, '');

  return input.replace(/\s+/g, ' ').trim();
}

// Removes the minimum number of unmatched parentheses in linear time.
// (A BFS over removals is exponential and lets a short search query hang the server.)
function removeInvalidParentheses(s: string) {
  // Forward pass: drop ')' with no open '(' before it.
  const chars: string[] = [];
  let open = 0;
  for (const char of s) {
    if (char === ')') {
      if (open === 0) continue;
      open--;
    } else if (char === '(') {
      open++;
    }
    chars.push(char);
  }

  // Backward pass: drop the rightmost `open` '(' left without a matching ')'.
  for (let i = chars.length - 1; i >= 0 && open > 0; i--) {
    if (chars[i] === '(') {
      chars[i] = '';
      open--;
    }
  }

  return chars.join('');
}

// Keys that only change how results are shown (or scope them to a list), not which items match.
const displayFilterKeys: string[] = [
  'page',
  'limit',
  'sortBy',
  'sortDir',
  'list_id',
  'colorTolerance',
  'colorType',
  'restockIncludeUnpriced',
];

const isFilledValue = (value: unknown) => value !== '' && value !== null && value !== undefined;

// Number of active filters that narrow the results: one per list value (e.g. each category)
// and one per range, however many of its bounds are set.
export const countActiveFilters = (filters: { [id: string]: any }) => {
  let count = 0;

  for (const [key, value] of Object.entries(getFiltersDiff(filters))) {
    if (displayFilterKeys.includes(key)) continue;

    if (!Array.isArray(value)) count += isFilledValue(value) ? 1 : 0;
    else if ((rangeFilters as readonly string[]).includes(key))
      count += value.some(isFilledValue) ? 1 : 0;
    else count += value.filter(isFilledValue).length;
  }

  return count;
};

// Comparable form of a filter value: empty ranges/lists/strings all read as '' and numbers
// parsed from the URL match the strings typed in the inputs.
const normalizeFilterValue = (value: unknown): string => {
  if (Array.isArray(value))
    return value.some(isFilledValue)
      ? JSON.stringify(value.map((v) => (isFilledValue(v) ? String(v) : '')))
      : '';

  return isFilledValue(value) && value !== false ? String(value) : '';
};

// Filter fields that differ between two filter sets, e.g. the sidebar draft vs. the applied ones.
export const getChangedFilterKeys = (a: { [id: string]: any }, b: { [id: string]: any }) =>
  (Object.keys(defaultFilters) as (keyof SearchFilters)[]).filter(
    (key) => key !== 'page' && normalizeFilterValue(a[key]) !== normalizeFilterValue(b[key])
  );

export const getFiltersDiff = (
  a: { [id: string]: any },
  b?: SearchFilters
): Partial<SearchFilters> => {
  if (!b) b = defaultFilters;
  const keys = Object.keys(b) as (keyof SearchFilters)[];
  const diff = {} as {
    [key in keyof SearchFilters]: any;
  };

  for (const key of keys) {
    if (a[key] && a[key] != b[key] && JSON.stringify(a[key]) != JSON.stringify(b[key]))
      diff[key] = a[key];
  }

  return diff as Partial<SearchFilters>;
};
