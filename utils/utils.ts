import { ItemProcess, Items, PriceProcess } from '@prisma/generated/client';
import { mean, standardDeviation } from 'simple-statistics';
import { ItemData, ItemFindAt, ListItemInfo, ShopInfo, TradeData, UserList } from '../types';
import Color from 'color';

export function getItemFindAtLinks(item: ItemData | Items): ItemFindAt {
  const findAt: ItemFindAt = {
    safetyDeposit: `https://www.neopets.com/safetydeposit.phtml?obj_name=${cleanItem(
      item
    )}&category=0`,
    shopWizard: null,
    auction: null,
    trading: null,
    closet: null,
    restockShop: null,
    dti: null,
    neosearch: null,
  };

  if (item.isWearable)
    findAt.closet = `https://www.neopets.com/closet.phtml?obj_name=${cleanItem(item)}`;

  if (item.isWearable) {
    if (item.item_id) findAt.dti = `http://impress.openneo.net/items/${item.item_id}`;
    else findAt.dti = `https://impress.openneo.net/items?q=${cleanItem(item)}`;
  }

  if (item.type !== 'np' || item.status?.toLowerCase() === 'no trade') return findAt;

  findAt.auction = `https://www.neopets.com/genie.phtml?type=process_genie&criteria=exact&auctiongenie=${cleanItem(
    item
  )}`;
  findAt.shopWizard = `https://www.neopets.com/shops/wizard.phtml?string=${cleanItem(item)}`;
  findAt.trading = `https://www.neopets.com/island/tradingpost.phtml?type=browse&&sort_by=newest&criteria=item_exact&search_string=${cleanItem(
    item
  )}`;

  if (
    item.rarity &&
    item.category &&
    item.rarity <= 100 &&
    categoryToShopID[item.category.toLowerCase()]
  ) {
    findAt.restockShop = `https://www.neopets.com/objects.phtml?type=shop&obj_type=${
      categoryToShopID[item.category.toLowerCase()]
    }`;
  }

  if (item.rarity === 200) {
    findAt.restockShop = `https://www.neopets.com/faerieland/hiddentower938.phtml`;
  }

  if (item.rarity && item.rarity <= 98) {
    findAt.neosearch = `https://www.neopets.com/search.phtml?selected_type=object&string=${cleanItem(
      item
    )}`;
  }

  return findAt;
}

// Borrowed from Dice's Search Helper - https://github.com/diceroll123/NeoSearchHelper/
function cleanItem(item: ItemData | Items | string) {
  const itemName = typeof item != 'string' ? item.name : item;
  return itemName
    .replaceAll('!', '%21')
    .replaceAll('#', '%23')
    .replaceAll('&', '%26')
    .replaceAll('(', '%28')
    .replaceAll(')', '%29')
    .replaceAll('*', '%2A')
    .replaceAll('+', '%2B')
    .replaceAll(',', '%2C')
    .replaceAll('/', '%2F')
    .replaceAll(':', '%3A')
    .replaceAll('?', '%3F')
    .replaceAll(' ', '+');
}

export function genItemKey(
  item: Items | ItemProcess | PriceProcess | ItemData | TradeData['items'][0],
  ignoreID = false
) {
  const image_id = item.image_id ?? '';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const item_id = item?.item_id ?? '';

  if (ignoreID) return item.name + image_id;

  return item.name + image_id + item_id;
}

export function coefficientOfVariation(x: number[]) {
  return (standardDeviation(x) / mean(x)) * 100;
}

export const categoryToShopID: { [id: string]: string } = {
  food: '1',
  'magic item': '2',
  baked: '15',
  book: '7',
  medicine: '13',
  'tropical food': '20',
  'space food': '22',
  petpet: '25',
  'aquatic petpet': '27',
  'spooky food': '30',
  'wintery petpet': '61',
  'spooky petpet': '31',
  'battle magic': '9',
  'ice crystal': '36',
  'snow food': '37',
  toy: '3',
  'faerie petpet': '40',
  'healthy food': '16',
  furniture: '41',
  coffee: '34',
  'brightvale motes': '82',
  'desert petpet': '50',
  'desert food': '49',
  'space battle': '23',
  candy: '14',
  'usuki doll': '48',
  gift: '17',
  clothes: '4',
  stamp: '58',
  'desert weapon': '54',
  'defence magic': '10',
  'haunted weaponry': '59',
  'desert scroll': '51',
  'faerie book': '38',
  'booktastic book': '70',
  'brightvale books': '77',
  'collectable card': '8',
  'faerie food': '39',
  'hot dog': '46',
  'jelly food': '62',
  pizza: '47',
  'tyrannian food': '42',
  'kiko lake food': '66',
  'kreludan food': '72',
  'brightvale fruit': '81',
  grooming: '5',
  instrument: '84',
  gardening: '12',
  'tyrannian furniture': '43',
  'spooky furniture': '60',
  'petpet supplies': '69',
  'kreludan furniture': '71',
  'brightvale windows': '79',
  'medieval petpet': '57',
  'tyrannian petpet': '44',
  'island merchandise': '21',
  school: '53',
  collectibles: '68',
  slushie: '35',
  'darigan toy': '74',
  smoothie: '18',
  'altadorian magic': '96',
  'altadorian food': '95',
  'altadorian petpets': '97',
  'altadorian armour': '94',
  'faerie weapon shop': '93',
  'qasalan tablets': '92',
  'faerie furniture': '75',
  'sea shells': '86',
  'qasalan food': '90',
  'brightvale armour': '80',
  'meridell potion': '73',
  'brightvale scroll': '78',
  'qasalan weaponry': '91',
  'desert pottery': '55',
  'geraptiku petpet': '89',
  'kiko lake carpentry': '67',
  'medical cures': '85',
  'maraquan petpets': '88',
  'robot petpet': '26',
  'roo island merchandise': '76',
  'brightvale potions': '83',
  'maractite weaponry': '87',
  'space defence': '24',
  'tyrannian weaponry': '45',
  plushies: '98',
  'wonderous weaponry': '100',
  'exotic foods': '101',
  'remarkable restoratives': '102',
  'fanciful fauna': '103',
  'neovian pastries': '105',
  'neovian attire': '107',
  'neovian press': '106',
  'neovian antiques': '104',
  'mystical surroundings': '108',
  'molten morsels': '112',
  "lampwyck's lights fantastic": '110',
  "cog's togs": '111',
  'moltaran books': '114',
  'moltaran petpets': '113',
  'springy things': '116',
  'ugga shinies': '117',
  'medieval food': '56',
  refreshments: '63',
};

export const shopIDToCategory: { [id: string]: string } = {
  '1': 'food',
  '2': 'magic item',
  '3': 'toy',
  '4': 'clothes',
  '5': 'grooming',
  '7': 'book',
  '8': 'collectable card',
  '9': 'battle magic',
  '10': 'defence magic',
  '12': 'gardening',
  '13': 'medicine',
  '14': 'candy',
  '15': 'baked',
  '16': 'healthy food',
  '17': 'gift',
  '18': 'smoothie',
  '20': 'tropical food',
  '21': 'island merchandise',
  '22': 'space food',
  '23': 'space battle',
  '24': 'space defence',
  '25': 'petpet',
  '26': 'robot petpet',
  '27': 'aquatic petpet',
  '30': 'spooky food',
  '31': 'spooky petpet',
  '34': 'coffee',
  '35': 'slushie',
  '36': 'ice crystal',
  '37': 'snow food',
  '38': 'faerie book',
  '39': 'faerie food',
  '40': 'faerie petpet',
  '41': 'furniture',
  '42': 'tyrannian food',
  '43': 'tyrannian furniture',
  '44': 'tyrannian petpet',
  '45': 'tyrannian weaponry',
  '46': 'hot dog',
  '47': 'pizza',
  '48': 'usuki doll',
  '49': 'desert food',
  '50': 'desert petpet',
  '51': 'desert scroll',
  '53': 'school',
  '54': 'desert weapon',
  '55': 'desert pottery',
  '56': 'medieval food',
  '57': 'medieval petpet',
  '58': 'stamp',
  '59': 'haunted weaponry',
  '60': 'spooky furniture',
  '61': 'wintery petpet',
  '62': 'jelly food',
  '63': 'refreshments',
  '66': 'kiko lake food',
  '67': 'kiko lake carpentry',
  '68': 'collectibles',
  '69': 'petpet supplies',
  '70': 'booktastic book',
  '71': 'kreludan furniture',
  '72': 'kreludan food',
  '73': 'meridell potion',
  '74': 'darigan toy',
  '75': 'faerie furniture',
  '76': 'roo island merchandise',
  '77': 'brightvale books',
  '78': 'brightvale scroll',
  '79': 'brightvale windows',
  '80': 'brightvale armour',
  '81': 'brightvale fruit',
  '82': 'brightvale motes',
  '83': 'brightvale potions',
  '84': 'instrument',
  '85': 'medical cures',
  '86': 'sea shells',
  '87': 'maractite weaponry',
  '88': 'maraquan petpets',
  '89': 'geraptiku petpet',
  '90': 'qasalan food',
  '91': 'qasalan weaponry',
  '92': 'qasalan tablets',
  '93': 'faerie weapon shop',
  '94': 'altadorian armour',
  '95': 'altadorian food',
  '96': 'altadorian magic',
  '97': 'altadorian petpets',
  '98': 'plushies',
  '100': 'wonderous weaponry',
  '101': 'exotic foods',
  '102': 'remarkable restoratives',
  '103': 'fanciful fauna',
  '104': 'neovian antiques',
  '105': 'neovian pastries',
  '106': 'neovian press',
  '107': 'neovian attire',
  '108': 'mystical surroundings',
  '110': "lampwyck's lights fantastic",
  '111': "cog's togs",
  '112': 'molten morsels',
  '113': 'moltaran petpets',
  '114': 'moltaran books',
  '116': 'springy things',
  '117': 'ugga shinies',
};

export const isMissingInfo = (item: ItemData) => {
  const neededFields: (keyof ItemData)[] = [
    'item_id',
    'name',
    'image_id',
    'rarity',
    'category',
    'description',
    'estVal',
    'weight',
  ];
  for (const key of neededFields) {
    if (item[key] === null) return true;
  }

  return false;
};

export const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export const rarityStr = (rarity: number) => {
  if (rarity <= 74) return null;

  if (rarity <= 84) return { text: 'uncommon', color: '#089d08' };

  if (rarity <= 89) return { text: 'rare', color: '#089d08' };

  if (rarity <= 94) return { text: 'very rare', color: '#089d08' };

  if (rarity <= 98) return { text: 'ultra rare', color: '#089d08' };

  if (rarity <= 99) return { text: 'super rare', color: '#089d08' };

  if (rarity <= 100) return { text: 'ultra rare', color: '#089d08' };

  if (rarity <= 104) return { text: 'special', color: '#d16778' };

  if (rarity <= 110) return { text: 'MEGA RARE', color: 'orange' };

  if (rarity <= 179) return { text: `RARITY ${rarity}`, color: '#fb4444' };

  if (rarity === 180) return { text: 'retired', color: '#a1a1a1' };

  if (rarity === 200 || rarity === 250) return { text: `Artifact - ${rarity}`, color: '#fb4444' };

  if (rarity === 500) return { text: 'Neocash', color: '#ec69ff' };

  return null;
};

const skip_terms = ['paperclip', 'paper clip', 'buying'];
export const shouldSkipTrade = (wishlist: string) => {
  if (skip_terms.some((term) => wishlist.toLowerCase().includes(term))) return true;

  let wishCpy = wishlist.toLowerCase().replaceAll(/nps?/g, '');
  wishCpy = wishCpy.replaceAll('reserved', '');
  wishCpy = wishCpy.replaceAll('res', '');
  wishCpy = wishCpy.replaceAll('r', '');
  wishCpy = wishCpy.trim();

  if (!isNaN(Number(wishCpy))) {
    if (!Number.isInteger(Number(wishCpy))) return false;
    if (Number(wishCpy) < 50000) return true;

    return false;
  }

  wishlist = wishlist.replaceAll('-no tags here-3', '');
  wishlist = wishlist.replaceAll(/:3[\s]|:3$/g, ' ');

  // Regular expression to check for a digit in the string
  const digitRegex = /\d/;

  return !digitRegex.test(wishlist);
};

export function getDateNST(timestamp?: number) {
  const todayNST = (
    typeof timestamp === 'number' ? new Date(timestamp) : new Date()
  ).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
  });

  return new Date(todayNST);
}

export function rarityToCCPoints(item: ItemData) {
  if (item.internal_id === 289) return 1;

  const rarity = item.rarity ?? 0;

  if (rarity <= 79 || rarity === 101) return 1;
  if (rarity <= 89) return 2;
  if (rarity <= 97) return 6;
  if (rarity <= 100) return 4;
  if (rarity <= 179) return 8;

  return 0;
}

export function stripMarkdown(markdownText: string) {
  // Remove headings
  markdownText = markdownText.replace(/#+\s/g, '');

  // Remove bold and italic formatting
  markdownText = markdownText.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2');

  // Remove links
  markdownText = markdownText.replace(/\[([^\]]+)\]\(.*?\)/g, '$1');

  // Remove inline code
  markdownText = markdownText.replace(/`([^`]+)`/g, '$1');

  // Remove block code
  markdownText = markdownText.replace(/```[\s\S]*?```/g, '');

  // Remove unordered lists
  markdownText = markdownText.replace(/(\*|-|\+)\s/g, '');

  // Remove ordered lists
  markdownText = markdownText.replace(/\d+\.\s/g, '');

  return markdownText;
}

export const tyrannianShops = [
  'Tyrannian Food',
  'Tyrannian Furniture',
  'Tyrannian Petpet',
  'Tyrannian Weaponry',
];
export const faerielandShops = ['Faerie Book', 'Faerie Food', 'Faerie Petpet'];
export const halloweenShops = [
  'Spooky Food',
  'Spooky Furniture',
  'Spooky Petpet',
  'Haunted Weaponry',
  'Neovian Antiques',
  'Neovian Attire',
  'Neovian Pastries',
  'Neovian Press',
];

export const restockBlackMarketItems = [
  687, 1048, 1949, 4944, 4972, 4998, 5041, 5072, 5092, 7307, 7400, 7624, 10371, 10380, 12360, 14461,
  14531, 17166, 18632, 19210, 19533, 20000, 20085, 20309, 22637, 22732, 22745, 22766, 29770, 32435,
  33285, 35776, 36958, 38350, 39703, 40119, 40158, 40703, 40815, 40857, 41371, 41506, 41682, 41956,
  42546, 42604, 42605, 42688, 44226, 49784,
];

export const getRestockPrice = (
  item: ItemData,
  ignoreSpecialDays = false,
  date?: number
): number[] | null => {
  if (!item.category || !item.rarity || !item.estVal) return null;

  const todayNST = getDateNST(date);

  let minPrice = Math.round(item.estVal * 1.44);
  let maxPrice = Math.round(item.estVal * 1.92);

  if (item.rarity <= 84) {
    minPrice = Math.max(minPrice, 100);
    maxPrice = Math.max(maxPrice, 100);
  } else if (item.rarity <= 89) {
    minPrice = Math.max(minPrice, 2500);
    maxPrice = Math.max(maxPrice, 2500);
  } else if (item.rarity <= 94) {
    minPrice = Math.max(minPrice, 5000);
    maxPrice = Math.max(maxPrice, 5000);
  } else if (item.rarity <= 99) {
    minPrice = Math.max(minPrice, 10000);
    maxPrice = Math.max(maxPrice, 10000);
  } else if (item.rarity === 200) {
    minPrice = item.estVal;
    maxPrice = item.estVal;
  }

  if (ignoreSpecialDays) return [minPrice, maxPrice];

  if (item.rarity === 200) {
    if (isThirdWednesday()) {
      return [minPrice * 0.97, maxPrice * 0.97].map((x) => Math.round(x));
    }

    return [minPrice, maxPrice];
  }

  if (todayNST.getDate() === 3) {
    return [minPrice * 0.5, maxPrice * 0.5].map((x) => Math.round(x));
  }

  // may 12
  else if (
    todayNST.getMonth() === 4 &&
    todayNST.getDate() === 12 &&
    tyrannianShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
  ) {
    return [minPrice * 0.2, maxPrice * 0.2].map((x) => Math.round(x));
  }

  //aug 20
  else if (
    todayNST.getMonth() === 7 &&
    todayNST.getDate() === 20 &&
    item.category.toLowerCase() === 'usuki doll'
  ) {
    return [minPrice * 0.33, maxPrice * 0.33].map((x) => Math.round(x));
  }

  // sept 20
  else if (
    todayNST.getMonth() === 8 &&
    todayNST.getDate() === 20 &&
    faerielandShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
  ) {
    return [minPrice * 0.33, maxPrice * 0.33].map((x) => Math.round(x));
  }

  // oct 31
  else if (
    todayNST.getMonth() === 9 &&
    todayNST.getDate() === 31 &&
    halloweenShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
  ) {
    return [minPrice * 0.33, maxPrice * 0.33].map((x) => Math.round(x));
  }

  return [minPrice, maxPrice];
};

export const getRestockProfit = (item: ItemData, ignoreSpecialDays = false) => {
  if (!item.price.value) return null;

  const prices = getRestockPrice(item, ignoreSpecialDays);

  if (!prices) return null;

  return item.price.value - prices[1];
};

export const getRestockProfitOnDate = (
  item: ItemData,
  date: Date | number,
  price?: number | null
) => {
  price = price ?? item.price.value ?? 0;
  if (!price) return null;

  let timestamp: number;
  if (date instanceof Date) timestamp = date.getTime();
  else timestamp = date;

  const prices = getRestockPrice(item, false, timestamp);

  if (!prices) return null;

  return price - prices[1];
};

export const restockShopInfo: { [id: string]: ShopInfo } = {
  '-1': {
    name: 'Almost Abandoned Attic',
    category: 'Other',
    difficulty: 'Medium',
    color: '#f4da18',
    id: '-1',
  },
  '-2': {
    name: 'Igloo Garage Sale',
    category: 'Other',
    difficulty: 'Medium',
    color: '#f4da18',
    id: '-2',
  },
  '-3': {
    name: 'Hidden Tower',
    category: 'Other',
    difficulty: 'Advanced',
    color: '#f4da18',
    id: '-3',
  },
  '1': {
    name: 'Neopian Fresh Foods',
    category: 'Foods',
    difficulty: 'Beginner',
    color: '#a17613',
    id: '1',
  },
  '2': {
    name: "Kauvara's Magic Shop",
    category: 'Potions',
    difficulty: 'Advanced',
    color: '#0e86c3',
    id: '2',
  },
  '3': { name: 'Toy Shop', category: 'Toys', difficulty: 'Medium', color: '#d7bb18', id: '3' },
  '4': {
    name: 'Unis Clothing Shop',
    category: 'Clothes',
    difficulty: 'Medium',
    color: '#1d78d6',
    id: '4',
  },
  '5': {
    name: 'Grooming Parlour',
    category: 'Other',
    difficulty: 'Medium',
    color: '#268dd5',
    id: '5',
  },
  '7': {
    name: 'Magical Bookshop',
    category: 'Books',
    difficulty: 'Beginner',
    color: '#408eb0',
    id: '7',
  },
  '8': {
    name: 'Collectable Card Shop',
    category: 'Collectibles',
    difficulty: 'Beginner',
    color: '#cc7f36',
    id: '8',
  },
  '9': {
    name: 'Battle Magic',
    category: 'Battledome',
    difficulty: 'Advanced',
    color: '#f4da18',
    id: '9',
  },
  '10': {
    name: 'Defense Magic',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#ddc022',
    id: '10',
  },
  '12': {
    name: 'Neopian Garden Centre',
    category: 'Furniture',
    difficulty: 'Beginner',
    color: '#f4d40c',
    id: '12',
  },
  '13': {
    name: 'Neopian Pharmacy',
    category: 'Potions',
    difficulty: 'Beginner',
    color: '#1ed2ea',
    id: '13',
  },
  '14': {
    name: 'Chocolate Factory',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#ecc44c',
    id: '14',
  },
  '15': {
    name: 'The Bakery',
    category: 'Foods',
    difficulty: 'Beginner',
    color: '#409cc9',
    id: '15',
  },
  '16': {
    name: 'Neopian Health Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#d07619',
    id: '16',
  },
  '17': {
    name: 'Neopian Gift Shop',
    category: 'Toys',
    difficulty: 'Beginner',
    color: '#dc471c',
    id: '17',
  },
  '18': {
    name: 'Smoothie Store',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#ea302a',
    id: '18',
  },
  '20': {
    name: 'Tropical Food Shop',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#d4ab12',
    id: '20',
  },
  '21': {
    name: 'Tiki Tack',
    category: 'Other',
    difficulty: 'Beginner',
    color: '#e90405',
    id: '21',
  },
  '22': {
    name: 'Grundos Cafe',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#0cbd28',
    id: '22',
  },
  '23': {
    name: 'Space Weaponry',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#ddd624',
    id: '23',
  },
  '24': {
    name: 'Space Armour',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#f10b22',
    id: '24',
  },
  '25': {
    name: 'The Neopian Petpet Shop',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#d59f2f',
    id: '25',
  },
  '26': {
    name: 'The Robo-Petpet Shop',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#dc1b1a',
    id: '26',
  },
  '27': {
    name: 'The Rock Pool',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#e2d70f',
    id: '27',
  },
  '30': {
    name: 'Spooky Food',
    category: 'Foods',
    difficulty: 'Beginner',
    color: '#1cdc24',
    id: '30',
  },
  '31': {
    name: 'Spooky Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#da0607',
    id: '31',
  },
  '34': {
    name: 'The Coffee Cave',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#e6b422',
    id: '34',
  },
  '35': {
    name: 'Slushie Shop',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#16ed16',
    id: '35',
  },
  '36': {
    name: 'Ice Crystal Shop',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#177abf',
    id: '36',
  },
  '37': {
    name: 'Super Happy Icy Fun Snow Shop',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#eae416',
    id: '37',
  },
  '38': {
    name: 'Faerieland Bookshop',
    category: 'Books',
    difficulty: 'Medium',
    color: '#aa7a3d',
    id: '38',
  },
  '39': {
    name: 'Faerie Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#d89429',
    id: '39',
  },
  '40': {
    name: 'Faerieland Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#e08e23',
    id: '40',
  },
  '41': {
    name: 'Neopian Furniture',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#7fd70f',
    id: '41',
  },
  '42': {
    name: 'Tyrannian Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#a5711f',
    id: '42',
  },
  '43': {
    name: 'Tyrannian Furniture',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#1490c3',
    id: '43',
  },
  '44': {
    name: 'Tyrannian Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#c38431',
    id: '44',
  },
  '45': {
    name: 'Tyrannian Weaponry',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#ea4014',
    id: '45',
  },
  '46': {
    name: "Hubert's Hot Dogs",
    category: 'Foods',
    difficulty: 'Medium',
    color: '#ecd90c',
    id: '46',
  },
  '47': { name: 'Pizzaroo', category: 'Foods', difficulty: 'Medium', color: '#4cb452', id: '47' },
  '48': { name: 'Usukiland', category: 'Toys', difficulty: 'Medium', color: '#f3c328', id: '48' },
  '49': {
    name: 'Lost Desert Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#f2c60e',
    id: '49',
  },
  '50': {
    name: "Peopatra's Petpets",
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#fadf3f',
    id: '50',
  },
  '51': {
    name: "Sutek's Scrolls",
    category: 'Books',
    difficulty: 'Medium',
    color: '#bc2c1c',
    id: '51',
  },
  '53': {
    name: 'Neopian School Supplies',
    category: 'Other',
    difficulty: 'Medium',
    color: '#2c5ce9',
    id: '53',
  },
  '54': {
    name: 'Sakhmet Battle Supplies',
    category: 'Battledome',
    difficulty: 'Advanced',
    color: '#d4a308',
    id: '54',
  },
  '55': {
    name: "Osiri's Pottery",
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#d6921f',
    id: '55',
  },
  '56': { name: 'Merifoods', category: 'Foods', difficulty: 'Medium', color: '#d1c335', id: '56' },
  '57': {
    name: 'Ye Olde Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#cf8e30',
    id: '57',
  },
  '58': {
    name: 'Neopian Post Office',
    category: 'Collectibles',
    difficulty: 'Advanced',
    color: '#eccf6e',
    id: '58',
  },
  '59': {
    name: 'Haunted Weaponry',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#b7a330',
    id: '59',
  },
  '60': {
    name: 'Spooky Furniture',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#8cb444',
    id: '60',
  },
  '61': {
    name: 'Wintery Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#f30404',
    id: '61',
  },
  '62': {
    name: 'Jelly Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#efb41d',
    id: '62',
  },
  '63': {
    name: 'Refreshments',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#0498c9',
    id: '63',
  },
  '66': {
    name: 'Kiko Lake Treats',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#d55c32',
    id: '66',
  },
  '67': {
    name: 'Kiko Lake Carpentry',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#f7c239',
    id: '67',
  },
  '68': {
    name: 'Collectable Coins',
    category: 'Collectibles',
    difficulty: 'Advanced',
    color: '#d7c912',
    id: '68',
  },
  '69': {
    name: 'Petpet Supplies',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#e5d407',
    id: '69',
  },
  '70': {
    name: 'Booktastic Books',
    category: 'Books',
    difficulty: 'Beginner',
    color: '#f7650a',
    id: '70',
  },
  '71': {
    name: 'Kreludan Homes',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#fc9c04',
    id: '71',
  },
  '72': {
    name: 'Cafe Kreludor',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#fc9a04',
    id: '72',
  },
  '73': {
    name: "Kayla's Potion Shop",
    category: 'Potions',
    difficulty: 'Beginner',
    color: '#d70404',
    id: '73',
  },
  '74': {
    name: 'Darigan Toys',
    category: 'Toys',
    difficulty: 'Medium',
    color: '#cecc32',
    id: '74',
  },
  '75': {
    name: 'Faerie Furniture',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#aa4eb3',
    id: '75',
  },
  '76': {
    name: 'Roo Island Souvenirs',
    category: 'Other',
    difficulty: 'Medium',
    color: '#0cc4fc',
    id: '76',
  },
  '77': {
    name: 'Brightvale Books',
    category: 'Books',
    difficulty: 'Medium',
    color: '#ba8d50',
    id: '77',
  },
  '78': {
    name: 'The Scrollery',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#f5d834',
    id: '78',
  },
  '79': {
    name: 'Brightvale Glaziers',
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#d19c17',
    id: '79',
  },
  '80': {
    name: 'Brightvale Armoury',
    category: 'Battledome',
    difficulty: 'Advanced',
    color: '#2f55bc',
    id: '80',
  },
  '81': {
    name: 'Brightvale Fruits',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#7cd444',
    id: '81',
  },
  '82': {
    name: 'Brightvale Motery',
    category: 'Other',
    difficulty: 'Medium',
    color: '#e05907',
    id: '82',
  },
  '83': {
    name: 'Royal Potionery',
    category: 'Potions',
    difficulty: 'Advanced',
    color: '#5274b7',
    id: '83',
  },
  '84': {
    name: 'Neopian Music Shop',
    category: 'Other',
    difficulty: 'Medium',
    color: '#d76312',
    id: '84',
  },
  '85': {
    name: 'Lost Desert Medicine',
    category: 'Potions',
    difficulty: 'Beginner',
    color: '#c46112',
    id: '85',
  },
  '86': {
    name: 'Collectable Sea Shells',
    category: 'Collectibles',
    difficulty: 'Advanced',
    color: '#2bcac9',
    id: '86',
  },
  '87': {
    name: 'Maractite Marvels',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#d4ac0c',
    id: '87',
  },
  '88': {
    name: 'Maraquan Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#c79e11',
    id: '88',
  },
  '89': {
    name: 'Geraptiku Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#b29f50',
    id: '89',
  },
  '90': {
    name: 'Qasalan Delights',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#84ec13',
    id: '90',
  },
  '91': {
    name: 'Desert Arms',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#c95005',
    id: '91',
  },
  '92': {
    name: 'Words of Antiquity',
    category: 'Books',
    difficulty: 'Medium',
    color: '#c5a73b',
    id: '92',
  },
  '93': {
    name: 'Faerie Weapon Shop',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#0ed673',
    id: '93',
  },
  '94': {
    name: 'Illustrious Armoury',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#b47e5c',
    id: '94',
  },
  '95': {
    name: 'Exquisite Ambrosia',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#d32e2e',
    id: '95',
  },
  '96': {
    name: 'Magical Marvels',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#e6d205',
    id: '96',
  },
  '97': {
    name: 'Legendary Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#dabe23',
    id: '97',
  },
  '98': {
    name: 'Plushie Palace',
    category: 'Toys',
    difficulty: 'Medium',
    color: '#f4bc0c',
    id: '98',
  },
  '100': {
    name: 'Wonderous Weaponry',
    category: 'Battledome',
    difficulty: 'Medium',
    color: '#e61216',
    id: '100',
  },
  '101': {
    name: 'Exotic Foods',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#ee0c0c',
    id: '101',
  },
  '102': {
    name: 'Remarkable Restoratives',
    category: 'Potions',
    difficulty: 'Medium',
    color: '#d5a444',
    id: '102',
  },
  '103': {
    name: 'Fanciful Fauna',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#de8517',
    id: '103',
  },
  '104': {
    name: "Chesterdrawers' Antiques",
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#d4bc0c',
    id: '104',
  },
  '105': {
    name: 'The Crumpetmonger',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#e49c34',
    id: '105',
  },
  '106': {
    name: 'Neovian Printing Press',
    category: 'Books',
    difficulty: 'Medium',
    color: '#915616',
    id: '106',
  },
  '107': {
    name: 'Prigpants & Swolthy, Tailors',
    category: 'Clothes',
    difficulty: 'Medium',
    color: '#be9c06',
    id: '107',
  },
  '108': {
    name: 'Mystical Surroundings',
    category: 'Clothes',
    difficulty: 'Medium',
    color: '#d0ba52',
    id: '108',
  },
  '110': {
    name: "Lampwyck's Lights Fantastic",
    category: 'Furniture',
    difficulty: 'Medium',
    color: '#dc5c1f',
    id: '110',
  },
  '111': {
    name: "Cog's Togs",
    category: 'Clothes',
    difficulty: 'Medium',
    color: '#d06441',
    id: '111',
  },
  '112': {
    name: 'Molten Morsels',
    category: 'Foods',
    difficulty: 'Medium',
    color: '#b3841b',
    id: '112',
  },
  '113': {
    name: 'Moltaran Petpets',
    category: 'Petpets',
    difficulty: 'Medium',
    color: '#ee1908',
    id: '113',
  },
  '114': {
    name: 'Moltaran Books',
    category: 'Books',
    difficulty: 'Beginner',
    color: '#fbc216',
    id: '114',
  },
  '116': {
    name: 'Springy Things',
    category: 'Toys',
    difficulty: 'Medium',
    color: '#d2522b',
    id: '116',
  },
  '117': {
    name: 'Ugga Shinies',
    category: 'Clothes',
    difficulty: 'Medium',
    color: '#d09916',
    id: '117',
  },
};

export const removeOutliers = (arr: number[], n: number) => {
  if (arr.length < 2) return arr;

  const stdDev = standardDeviation(arr);
  const meanval = mean(arr);

  const newArr = arr.filter((x) => Math.abs(x - meanval) < n * stdDev);

  if (newArr.length < 2) return arr;

  return newArr;
};

export const msIntervalFormatted = (ms: number, long = false, precision = 0) => {
  if (ms < 1000) return `${ms}${long ? ' milliseconds' : 'ms'}`;

  if (ms < 60 * 1000)
    return `${!precision ? Math.round(ms / 1000) : (ms / 1000).toFixed(precision)}${
      long ? ' seconds' : 's'
    }`;

  if (ms < 60 * 60 * 1000)
    return `${!precision ? Math.round(ms / 60000) : (ms / 60000).toFixed(precision)}${
      long ? ' minutes' : 'm'
    }`;

  if (ms < 24 * 60 * 60 * 1000)
    return `${!precision ? Math.round(ms / 3600000) : (ms / 3600000).toFixed(precision)}${
      long ? ' hours' : 'h'
    }`;

  return `${!precision ? Math.round(ms / 86400000) : (ms / 86400000).toFixed(precision)}${
    long ? ' days' : 'd'
  }`;
};

export const isDynamicActionDisabled = (
  action: 'move' | 'add' | 'remove',
  dynamicType: 'addOnly' | 'removeOnly' | 'fullSync' | null
) => {
  if (!dynamicType) return false;

  if (dynamicType === 'fullSync') return true;

  if (dynamicType === 'addOnly') {
    if (action === 'remove') return true;
    if (action === 'move') return true;
    if (action === 'add') return false;
  }

  if (dynamicType === 'removeOnly') {
    if (action === 'remove') return false;
    if (action === 'move') return false;
    if (action === 'add') return true;
  }

  return false;
};

export const deseaseList_en = [
  'Any Disease',
  'Neogitus',
  'Bloaty Belly',
  'Fuzzitus',
  'Achy Head',
  'Shock -A- Lots',
  'Watery Eyes',
  'NeoBlues',
  'Floppy Tongue',
  'Cricky Neck',
  'NeoMites',
  'Blurred Vision',
  'Neggitus',
  'Sneezles',
  "D'achoo",
  'Shaky Flakys',
  'Grumbles',
  'Chickaroo',
  'Bloaty Feet',
  'Kikoughela',
  'Lumps',
  'NeoPhobia',
  'Hoochie Coochies',
  'NeoMonia',
  'Neezles',
  'Itchy Scratchies',
  'NeoPox',
  'NeoWarts',
  'Bubbles',
  'Neo Flu',
  'Fuzzy Fungus',
  'Ugga-Ugga',
  'Reptillioritus',
  'Doldrums',
  'Jitters',
  'Spyder Bite',
  'Pollenitus',
];

export const deseaseList_pt = [
  'Qualquer Doença',
  'Neogitus',
  'Barriga Inchada',
  'Bolinite',
  'Cabeça Latejante',
  'Eletrichoquinite',
  'Olhos Ensopados',
  'NeoDeprê',
  'Língua Frouxa',
  'Pescoço Bichado',
  'NeoÁcaros',
  'Visão Embaçada',
  'Neggitus',
  'Espirros',
  'Atchim!',
  'Treme-Treme',
  'Roncos',
  'Síndrome da Galinha',
  'Pés Inchados',
  'Kikuguela',
  'Pelotas',
  'NeoFobia',
  'Gandaíte',
  'NeoMonia',
  'NeoSarampo',
  'Coceira',
  'NeoVaríola',
  'NeoVerrugas',
  'Bolhas',
  'NeoGripe',
  'Cogumelo Encrespado',
  'Uga-Uga',
  'Reptilioritite',
  'Mau-humor',
  'Nervosismos',
  'Mordida de Aranha',
  'Pollenitus',
];

export const getDiseaseTranslation = (disease: string, lang: 'en' | 'pt') => {
  const index = deseaseList_en.indexOf(disease);

  return index === -1 ? disease : lang === 'pt' ? deseaseList_pt[index] : deseaseList_en[index];
};

export const allFoodsCats = [
  'Altadorian Food',
  'Aquatic Food',
  'Baked',
  'Brightvale Fruit',
  'Candy',
  'Coffee',
  'Desert Food',
  'Exotic Foods',
  'Faerie Food',
  'Food',
  'Gross Food',
  'Healthy Food',
  'Hot Dog',
  'Jelly Food',
  'Kiko Lake Food',
  'Kreludan Food',
  'Medieval Food',
  'Molten Morsels',
  'Neovian Pastries',
  'Pizza',
  'Qasalan Food',
  'Refreshments',
  'Slushie',
  'Smoothie',
  'Snow Food',
  'Space Food',
  'Spooky Food',
  'Tropical Food',
  'Tyrannian Food',
];

export const allPlayCats = [
  'Broken Toy',
  'Darigan Toy',
  'Instrument',
  'Plushies',
  'Springy Things',
  'Toy',
  'Usuki Doll',
];

export const allBooksCats = [
  'Book',
  'Booktastic Book',
  'Brightvale Book',
  'Desert Scroll',
  'Faerie Book',
  'Moltaran Book',
  'Neovian Press',
  'Quasalan Tablets',
];

export const promiseAllLimit = async <T>(
  arr: Promise<T>[],
  limit: number,
  continueOnThrow = false
) => {
  const results: T[] = [];

  for (let i = 0; i < arr.length; i += limit) {
    try {
      const chunk = arr.slice(i, i + limit);
      const res = await Promise.all(chunk);
      results.push(...res);
    } catch (e) {
      if (continueOnThrow) {
        console.error(e);
      } else {
        throw e;
      }
    }
  }

  return results;
};

export function isThirdWednesday(date?: Date) {
  date = date || getDateNST();
  return date.getDay() === 3 && Math.floor((date.getDate() - 1) / 7) === 2;
}

export function nextThirdWednesday(date?: Date) {
  date = date || getDateNST();
  const month = date.getMonth();
  const year = date.getFullYear();

  let thirdWednesday = new Date(year, month, 1);
  thirdWednesday.setDate(1 + ((3 - thirdWednesday.getDay() + 7) % 7) + 14);

  if (thirdWednesday <= date) {
    thirdWednesday = new Date(year, month + 1, 1);
    thirdWednesday.setDate(1 + ((3 - thirdWednesday.getDay() + 7) % 7) + 14);
  }

  return thirdWednesday;
}

// based on https://www.reddit.com/r/neopets/comments/16u9rx5/restocking_specifics
export const restockChance: { [rarity: number]: number } = {
  '1': 50.00644,
  '2': 47.32247,
  '3': 46.828599999999994,
  '4': 46.321839999999995,
  '5': 45.83173,
  '6': 45.34559,
  '7': 44.80916,
  '8': 44.33321,
  '9': 43.82799,
  '10': 43.32578,
  '11': 42.8143,
  '12': 42.31969,
  '13': 41.83229,
  '14': 41.33428,
  '15': 40.831430000000005,
  '16': 40.33792,
  '17': 39.827709999999996,
  '18': 39.334540000000004,
  '19': 38.82991,
  '20': 38.31781,
  '21': 37.8325,
  '22': 37.333,
  '23': 36.79735,
  '24': 36.32756,
  '25': 35.81935,
  '26': 35.34415,
  '27': 34.82313,
  '28': 34.32168,
  '29': 33.82233,
  '30': 33.31272,
  '31': 32.833780000000004,
  '32': 32.31772,
  '33': 31.823400000000003,
  '34': 31.34799,
  '35': 30.83759,
  '36': 30.328100000000003,
  '37': 29.83863,
  '38': 29.331819999999997,
  '39': 28.83867,
  '40': 28.3586,
  '41': 27.82538,
  '42': 27.34204,
  '43': 26.820240000000002,
  '44': 26.332359999999998,
  '45': 25.827699999999997,
  '46': 25.338430000000002,
  '47': 24.820919999999997,
  '48': 24.3226,
  '49': 23.821649999999998,
  '50': 23.35047,
  '51': 22.82741,
  '52': 22.358520000000002,
  '53': 21.82932,
  '54': 21.31389,
  '55': 20.809440000000002,
  '56': 20.33972,
  '57': 19.83111,
  '58': 19.33278,
  '59': 18.84072,
  '60': 18.32499,
  '61': 17.8428,
  '62': 17.32757,
  '63': 16.8244,
  '64': 16.33678,
  '65': 15.84589,
  '66': 15.32205,
  '67': 14.82658,
  '68': 14.337929999999998,
  '69': 13.82072,
  '70': 13.30812,
  '71': 12.77894,
  '72': 12.23332,
  '73': 11.66976,
  '74': 11.12997,
  '75': 10.55744,
  '76': 9.93737,
  '77': 9.32731,
  '78': 8.70481,
  '79': 8.06996,
  '80': 7.411320000000001,
  '81': 6.7438,
  '82': 6.26823,
  '83': 5.746359999999999,
  '84': 5.25449,
  '85': 4.7447799999999996,
  '86': 4.25393,
  '87': 3.74233,
  '88': 3.25861,
  '89': 2.74638,
  '90': 2.29923,
  '91': 1.8697700000000002,
  '92': 1.5053800000000002,
  '93': 1.17004,
  '94': 0.87659,
  '95': 0.62489,
  '96': 0.41913,
  '97': 0.25166,
  '98': 0.12780999999999998,
  '99': 0.04084,
  '100': 0.008119999999999999,
};

export const sortListItems = (
  a: ListItemInfo,
  b: ListItemInfo,
  sortBy: string,
  sortDir: string,
  items: { [id: string]: ItemData }
) => {
  const itemA = items[a.item_iid];
  const itemB = items[b.item_iid];
  if (!itemA || !itemB) return 0;

  if (sortBy === 'name') {
    if (sortDir === 'asc') return itemA.name.localeCompare(itemB.name);
    else return itemB.name.localeCompare(itemA.name);
  } else if (sortBy === 'rarity') {
    if (sortDir === 'asc') {
      return (itemA.rarity ?? 0) - (itemB.rarity ?? 0);
    }

    return (itemB.rarity ?? 0) - (itemA.rarity ?? 0);
  } else if (sortBy === 'price') {
    if (sortDir === 'asc')
      return (
        (itemA.price.value ?? Infinity) - (itemB.price.value ?? Infinity) ||
        (itemA.ncValue?.minValue ?? -1) - (itemB.ncValue?.minValue ?? -1)
      );
    else
      return (
        (itemB.price.value ?? Infinity) - (itemA.price.value ?? Infinity) ||
        (itemB.ncValue?.minValue ?? -1) - (itemA.ncValue?.minValue ?? -1)
      );
  } else if (sortBy === 'item_id') {
    if (sortDir === 'asc') return (itemA.item_id ?? 0) - (itemB.item_id ?? 0);

    return (itemB.item_id ?? 0) - (itemA.item_id ?? 0);
  } else if (sortBy === 'addedAt') {
    const dateA = new Date(a.addedAt);
    const dateB = new Date(b.addedAt);

    if (sortDir === 'asc') return dateA.getTime() - dateB.getTime();
    else return dateB.getTime() - dateA.getTime();
  } else if (sortBy === 'color') {
    const colorA = new Color(itemA.color.hex);
    const colorB = new Color(itemB.color.hex);
    const hsvA = colorA.hsv().array();
    const hsvB = colorB.hsv().array();

    if (sortDir === 'asc') return hsvB[0] - hsvA[0] || hsvB[1] - hsvA[1] || hsvB[2] - hsvA[2];
    else return hsvA[0] - hsvB[0] || hsvA[1] - hsvB[1] || hsvA[2] - hsvB[2];
  } else if (sortBy === 'custom') {
    if (sortDir === 'asc') return (a.order ?? -1) - (b.order ?? -1);
    else return (b.order ?? -1) - (a.order ?? -1);
  } else if (sortBy === 'faerieFest') {
    const ffA = rarityToCCPoints(itemA);
    const ffB = rarityToCCPoints(itemB);

    if (sortDir === 'asc') return (ffA || 1000) - (ffB || 1000);
    else return ffB - ffA;
  }

  return 0;
};

export const dynamicListCan = (list: UserList | undefined, permission: 'add' | 'remove') => {
  if (!list) return false;

  if (!list.dynamicType) return true;

  // fullSync lists can't be modified manually
  if (list.dynamicType === 'fullSync') return false;

  if (permission === 'add') {
    if (list.dynamicType === 'addOnly') return true;
    if (list.dynamicType === 'removeOnly') return false;
  }

  if (permission === 'remove') {
    if (list.dynamicType === 'addOnly') return false;
    if (list.dynamicType === 'removeOnly') return true;
  }

  return true;
};
