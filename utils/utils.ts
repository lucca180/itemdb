import { ItemProcess, Items, PriceProcess } from '@prisma/client';
import { mean, sampleStandardDeviation } from 'simple-statistics';
import { ItemData, ItemFindAt, TradeData } from '../types';

export function getItemFindAtLinks(item: ItemData | Items): ItemFindAt {
  const findAt: ItemFindAt = {
    safetyDeposit: `https://www.neopets.com/safetydeposit.phtml?obj_name=${cleanItem(
      item
    )}&category=0`,
  };

  if (item.isWearable)
    findAt.closet = `https://www.neopets.com/closet.phtml?obj_name=${cleanItem(item)}`;

  if (item.isWearable) {
    if (item.item_id) findAt.dti = `http://impress-2020.openneo.net/items/${item.item_id}`;
    else
      findAt.dti = `http://impress-2020.openneo.net/items/search/${cleanItem(item).replaceAll(
        '+',
        '%20'
      )}`;
  }

  if (item.type !== 'np') return findAt;

  findAt.auction = `https://www.neopets.com/genie.phtml?type=process_genie&criteria=exact&auctiongenie=${cleanItem(
    item
  )}`;
  findAt.shopWizard = `https://www.neopets.com/shops/wizard.phtml?string=${cleanItem(item)}`;
  findAt.trading = `https://www.neopets.com/island/tradingpost.phtml?type=browse&criteria=item_exact&search_string=${cleanItem(
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
  return (sampleStandardDeviation(x) / mean(x)) * 100;
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
  for (const [key, val] of Object.entries(item)) {
    if (['comment', 'specialType'].includes(key)) continue;

    if (val === null) return true;
  }

  return false;
};
