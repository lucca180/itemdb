import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import { buildCardItem, buildPreviewRow, neopetsImage } from './importPreviewBuilders';

const STALE_DATE = '2024-01-15T12:00:00.000Z';
const RECENT_DATE = '2026-07-01T08:30:00.000Z';

/**
 * Curated import preview rows for unit tests.
 * Covers NP/NC/PB, price states, quantities, and edge cases.
 */
export const IMPORT_PREVIEW_TEST_ITEMS: ImportPreviewItem[] = [
  buildPreviewRow(
    '85020',
    buildCardItem({
      internal_id: 42,
      item_id: 85020,
      name: 'Red Codestone',
      image: neopetsImage('codestone_red'),
      type: 'np',
      category: 'Stone',
      rarity: 40,
      estVal: 2500,
      colorHex: '#C53030',
      price: {
        type: 'np',
        value: 2_450,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    12
  ),
  buildPreviewRow(
    '85021',
    buildCardItem({
      internal_id: 43,
      item_id: 85021,
      name: 'Bri Codestone',
      image: neopetsImage('codestone_bri'),
      type: 'np',
      category: 'Stone',
      rarity: 40,
      estVal: 2500,
      colorHex: '#2B6CB0',
      price: {
        type: 'np',
        value: 2_600,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    8
  ),
  buildPreviewRow(
    '44752',
    buildCardItem({
      internal_id: 44,
      item_id: 44752,
      name: 'Baby Paint Brush',
      image: neopetsImage('babypaintbrush'),
      type: 'pb',
      category: 'Paint Brush',
      rarity: 100,
      estVal: 600_000,
      colorHex: '#F6AD55',
      price: {
        type: 'np',
        value: 625_000,
        flags: ['inflation'],
        addedAt: RECENT_DATE,
      },
    }),
    1
  ),
  buildPreviewRow(
    '44753',
    buildCardItem({
      internal_id: 45,
      item_id: 44753,
      name: 'Darigan Paint Brush',
      image: neopetsImage('dariganpaintbrush'),
      type: 'pb',
      category: 'Paint Brush',
      rarity: 100,
      estVal: 4_500_000,
      colorHex: '#553C9A',
      price: {
        type: 'np',
        value: 4_890_000,
        flags: [],
        addedAt: STALE_DATE,
        context: 'Last confirmed before NC event',
      },
    }),
    1
  ),
  buildPreviewRow(
    '12011',
    buildCardItem({
      internal_id: 46,
      item_id: 12011,
      name: 'Faerie Paint Brush',
      image: neopetsImage('faeriepaintbrush'),
      type: 'pb',
      category: 'Paint Brush',
      rarity: 100,
      estVal: 1_800_000,
      colorHex: '#D6BCFA',
      price: null,
      status: 'no trade',
    }),
    1
  ),
  buildPreviewRow(
    '88188',
    buildCardItem({
      internal_id: 47,
      item_id: 88188,
      name: 'Secret Laboratory Map',
      image: neopetsImage('secret_lab_map'),
      type: 'np',
      category: 'Map',
      rarity: 90,
      estVal: 95_000,
      colorHex: '#38A169',
      price: {
        type: 'np',
        value: 102_500,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    1
  ),
  buildPreviewRow(
    '88189',
    buildCardItem({
      internal_id: 48,
      item_id: 88189,
      name: 'Secret Laboratory Map Piece',
      image: neopetsImage('secret_lab_map_piece'),
      type: 'np',
      category: 'Map',
      rarity: 90,
      estVal: 8_000,
      colorHex: '#68D391',
      price: {
        type: 'np',
        value: 9_250,
        flags: ['outdated'],
        addedAt: STALE_DATE,
      },
    }),
    3
  ),
  buildPreviewRow(
    '55001',
    buildCardItem({
      internal_id: 49,
      item_id: 55001,
      name: 'Earning Interest',
      image: neopetsImage('np_coin_stack'),
      type: 'np',
      category: 'Special',
      rarity: 101,
      estVal: 1,
      colorHex: '#ECC94B',
      price: {
        type: 'np',
        value: 1,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    100
  ),
  buildPreviewRow(
    '66001',
    buildCardItem({
      internal_id: 50,
      item_id: 66001,
      name: 'Wooden Blocking Shield',
      image: neopetsImage('woodblockshield'),
      type: 'np',
      category: 'Battle',
      rarity: 50,
      estVal: 800,
      colorHex: '#975A16',
      price: {
        type: 'np',
        value: 750,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    5
  ),
  buildPreviewRow(
    '77001',
    buildCardItem({
      internal_id: 51,
      item_id: 77001,
      name: 'Flaming Battle Axe',
      image: neopetsImage('flamingbattleaxe'),
      type: 'np',
      category: 'Battle',
      rarity: 99,
      estVal: 1_200_000,
      colorHex: '#E53E3E',
      price: {
        type: 'np',
        value: 1_450_000,
        flags: ['inflation'],
        addedAt: RECENT_DATE,
      },
    }),
    2
  ),
  buildPreviewRow(
    'nc-mall-001',
    buildCardItem({
      internal_id: 52,
      item_id: null,
      name: 'Sparkling Gown',
      image: neopetsImage('nc_sparkling_gown'),
      type: 'nc',
      category: 'Clothes',
      rarity: 500,
      flags: ['wearable'],
      colorHex: '#ED64A6',
      price: {
        type: 'ncMall',
        price: 1_200,
        saleBegin: null,
        saleEnd: null,
        discountBegin: '2026-06-01T00:00:00.000Z',
        discountEnd: '2026-09-01T00:00:00.000Z',
        discountPrice: 900,
      },
    }),
    1
  ),
  buildPreviewRow(
    'nc-trade-001',
    buildCardItem({
      internal_id: 53,
      item_id: null,
      name: 'Altador Cup Fanatic Background',
      image: neopetsImage('nc_ac_background'),
      type: 'nc',
      category: 'Background',
      rarity: 500,
      colorHex: '#3182CE',
      price: null,
      ncValue: {
        minValue: 3,
        maxValue: 5,
        range: '3-5',
        addedAt: RECENT_DATE,
        source: 'itemdb',
      },
    }),
    1
  ),
  buildPreviewRow(
    'nc-trade-002',
    buildCardItem({
      internal_id: 54,
      item_id: null,
      name: 'Retired NC Wings',
      image: neopetsImage('nc_retired_wings'),
      type: 'nc',
      category: 'Clothes',
      rarity: 500,
      flags: ['wearable'],
      colorHex: '#805AD5',
      price: null,
      ncValue: {
        minValue: 45,
        maxValue: 55,
        range: '45-55',
        addedAt: RECENT_DATE,
        source: 'lebron',
        isVolatile: true,
      },
    }),
    1
  ),
  buildPreviewRow(
    'nc-unknown-001',
    buildCardItem({
      internal_id: 55,
      item_id: null,
      name: 'Unreleased NC Beta Item',
      image: neopetsImage('nc_beta_item'),
      type: 'nc',
      category: 'Special',
      rarity: 500,
      colorHex: '#718096',
      price: null,
    }),
    2
  ),
  buildPreviewRow(
    '33001',
    buildCardItem({
      internal_id: 56,
      item_id: 33001,
      name: 'White Chocolate Skeith',
      image: neopetsImage('whitechocskeith'),
      type: 'np',
      category: 'Food',
      rarity: 80,
      estVal: 3_500,
      colorHex: '#F7FAFC',
      price: {
        type: 'np',
        value: 3_800,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    4
  ),
  buildPreviewRow(
    '33002',
    buildCardItem({
      internal_id: 57,
      item_id: 33002,
      name: 'Grilled Stuffed Tofu',
      image: neopetsImage('grilledstuffedtofu'),
      type: 'np',
      category: 'Food',
      rarity: 75,
      estVal: 1_200,
      colorHex: '#C6F6D5',
      price: {
        type: 'np',
        value: 1_150,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    6
  ),
  buildPreviewRow(
    '22001',
    buildCardItem({
      internal_id: 58,
      item_id: 22001,
      name: 'Snowbunny Plushie',
      image: neopetsImage('snowbunnyplushie'),
      type: 'np',
      category: 'Toy',
      rarity: 60,
      estVal: 2_800,
      colorHex: '#E2E8F0',
      price: {
        type: 'np',
        value: 3_100,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    1
  ),
  buildPreviewRow(
    '22002',
    buildCardItem({
      internal_id: 59,
      item_id: 22002,
      name: 'Usuki',
      image: neopetsImage('usuki_doll'),
      type: 'np',
      category: 'Toy',
      rarity: 65,
      estVal: 4_500,
      colorHex: '#FBB6CE',
      price: {
        type: 'np',
        value: 4_900,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    7
  ),
  buildPreviewRow(
    '11001',
    buildCardItem({
      internal_id: 60,
      item_id: 11001,
      name: 'Green Negg',
      image: neopetsImage('negg_green'),
      type: 'np',
      category: 'Food',
      rarity: 95,
      estVal: 18_000,
      colorHex: '#48BB78',
      price: {
        type: 'np',
        value: 19_500,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    1
  ),
  buildPreviewRow(
    '11002',
    buildCardItem({
      internal_id: 61,
      item_id: 11002,
      name: 'Rainbow Negg',
      image: neopetsImage('negg_rainbow'),
      type: 'np',
      category: 'Food',
      rarity: 99,
      estVal: 850_000,
      colorHex: '#9F7AEA',
      price: {
        type: 'np',
        value: 920_000,
        flags: [],
        addedAt: RECENT_DATE,
      },
    }),
    1
  ),
  buildPreviewRow(
    '99001',
    buildCardItem({
      internal_id: 62,
      item_id: 99001,
      name: 'Unbuyable Restock',
      image: neopetsImage('r99_restock'),
      type: 'np',
      category: 'Toy',
      rarity: 99,
      estVal: 2_500_000,
      colorHex: '#FC8181',
      price: null,
    }),
    1
  ),
];

/** Keys that were in the import session but could not be resolved to items. */
export const IMPORT_PREVIEW_TEST_NOT_FOUND_KEYS = [
  '99999999',
  'Ghost Meepit Plushie (typo)',
] as const;

/** Session-level metadata for import preview tests. */
export const IMPORT_PREVIEW_TEST_SESSION = {
  importToken: 'test-fixture-token',
  itemCount: IMPORT_PREVIEW_TEST_ITEMS.length + IMPORT_PREVIEW_TEST_NOT_FOUND_KEYS.length,
  resolvedCount: IMPORT_PREVIEW_TEST_ITEMS.length,
  notFoundCount: IMPORT_PREVIEW_TEST_NOT_FOUND_KEYS.length,
  notFoundKeys: [...IMPORT_PREVIEW_TEST_NOT_FOUND_KEYS],
  indexType: 'item_id' as const,
  recommendedListId: null as number | null,
};
