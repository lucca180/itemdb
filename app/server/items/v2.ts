import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import {
  ALL_ITEM_V2_FIELDS,
  getIntentFields,
  type ItemFlags,
  type ItemIntent,
  type ItemSaleStatusV2,
  type ItemV2,
  type ItemV2For,
} from '@types';
import {
  mapItemV2NcValue,
  mapItemV2Price,
  type MapItemV2Options,
} from '@app/server/items/itemV2Price';
import { asJsonDate, asNumber, asString, type RawItemV2Row } from '@app/server/items/itemV2Raw';

export type { MapItemV2Options } from '@app/server/items/itemV2Price';
export type { RawItemV2Row } from '@app/server/items/itemV2Raw';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';

type RawIdValue = string | number;
type JoinName = 'color' | 'npPrice' | 'ncValue' | 'owlsPrice' | 'ncMall' | 'saleStats';
type ColumnName = keyof typeof RAW_COLUMNS;

/**
 * Canonical list of lookup kinds for `getManyItemsV2` — one active filter per query.
 * Single source of truth: HTTP parsing (`parse.ts`) and the cache layer
 * (`itemV2Cache.ts`) import this instead of re-declaring the same literals.
 */
export const FIND_MANY_ITEMS_V2_TYPES = [
  'id',
  'item_id',
  'name_image_id',
  'image_id',
  'name',
  'slug',
] as const;

export type FindManyItemsV2Type = (typeof FIND_MANY_ITEMS_V2_TYPES)[number];

/**
 * Batch lookup: which field to filter on + the values.
 * Response keys match `data` encoding for that `type` (see `resolveLookup`).
 */
export type FindManyItemsV2Query =
  | { type: 'id'; data: RawIdValue[] }
  | { type: 'item_id'; data: RawIdValue[] }
  | { type: 'name_image_id'; data: [string, string][] }
  | { type: 'image_id'; data: string[] }
  | { type: 'name'; data: string[] }
  | { type: 'slug'; data: string[] };

/**
 * Redis/response key for a `name_image_id` pair — the one lookup kind whose
 * encoding isn't just `String(value)`. Shared by `resolveLookup` (below) and
 * the cache layer so the two never drift apart.
 */
export function encodeNameImageKey(name: string, imageId: string): string {
  return `${encodeURI(name.toLowerCase())}_${imageId}`;
}

export type GetManyItemsV2Options<I extends ItemIntent> = {
  intent?: I;
  limit?: number;
};

const RAW_COLUMNS = {
  internal_id: Prisma.sql`a.internal_id`,
  item_id: Prisma.sql`a.item_id`,
  name: Prisma.sql`a.name`,
  description: Prisma.sql`a.description`,
  image: Prisma.sql`a.image`,
  image_id: Prisma.sql`a.image_id`,
  imgCacheOverride: Prisma.sql`a.imgCacheOverride`,
  category: Prisma.sql`a.category`,
  rarity: Prisma.sql`a.rarity`,
  weight: Prisma.sql`a.weight`,
  type: Prisma.sql`a.type`,
  isWearable: Prisma.sql`a.isWearable`,
  isNeohome: Prisma.sql`a.isNeohome`,
  isBD: Prisma.sql`a.isBD`,
  flags: Prisma.sql`a.flags`,
  est_val: Prisma.sql`a.est_val`,
  status: Prisma.sql`a.status`,
  slug: Prisma.sql`a.slug`,
  comment: Prisma.sql`a.comment`,
  canonical_id: Prisma.sql`a.canonical_id`,
  addedAt: Prisma.sql`a.addedAt`,
  canEat: Prisma.sql`a.canEat`,
  canRead: Prisma.sql`a.canRead`,
  canOpen: Prisma.sql`a.canOpen`,
  canPlay: Prisma.sql`a.canPlay`,
  colorHex: Prisma.sql`color.hex AS colorHex`,
  npPrice: Prisma.sql`npPrice.price AS npPrice`,
  priceAddedAt: Prisma.sql`npPrice.addedAt AS priceAddedAt`,
  priceInflationId: Prisma.sql`npPrice.noInflation_id AS priceInflationId`,
  priceManualCheck: Prisma.sql`npPrice.manual_check AS priceManualCheck`,
  priceContext: Prisma.sql`npPrice.priceContext AS priceContext`,
  ncValueAddedAt: Prisma.sql`ncValue.addedAt AS ncValueAddedAt`,
  ncValueMin: Prisma.sql`ncValue.minValue AS ncValueMin`,
  ncValueMax: Prisma.sql`ncValue.maxValue AS ncValueMax`,
  ncValueRange: Prisma.sql`ncValue.valueRange AS ncValueRange`,
  owlsPricedAt: Prisma.sql`owlsPrice.pricedAt AS owlsPricedAt`,
  owlsValue: Prisma.sql`owlsPrice.value AS owlsValue`,
  owlsValueMin: Prisma.sql`owlsPrice.valueMin AS owlsValueMin`,
  ncMallPrice: Prisma.sql`ncMall.price AS ncMallPrice`,
  ncMallSaleBegin: Prisma.sql`ncMall.saleBegin AS ncMallSaleBegin`,
  ncMallSaleEnd: Prisma.sql`ncMall.saleEnd AS ncMallSaleEnd`,
  ncMallDiscountBegin: Prisma.sql`ncMall.discountBegin AS ncMallDiscountBegin`,
  ncMallDiscountEnd: Prisma.sql`ncMall.discountEnd AS ncMallDiscountEnd`,
  ncMallDiscountPrice: Prisma.sql`ncMall.discountPrice AS ncMallDiscountPrice`,
  saleStats: Prisma.sql`saleStats.stats AS saleStats`,
  saleAdded: Prisma.sql`saleStats.addedAt AS saleAdded`,
} as const;

const NC_VALUES_TYPE = process.env.NC_VALUES_TYPE;

/**
 * JOINs needed for the configured NC value source. `NC_VALUES_TYPE` is a static
 * per-deployment env var (never varies per request), so the unused source's JOIN
 * can be dropped entirely instead of always paying for both `ncValues` and
 * `owlsPrice` on every `card`/`pricer`/`full` query.
 *
 * `MapItemV2Options.ncValuesType` (a test-only override — no production call site
 * passes it) does not affect this: it bypasses the query planner and reads
 * whatever columns the caller's raw row already has.
 */
export const NC_VALUE_JOINS: readonly JoinName[] =
  NC_VALUES_TYPE === 'lebron'
    ? ['owlsPrice']
    : NC_VALUES_TYPE === 'itemdb'
      ? ['ncValue']
      : NC_VALUES_TYPE === 'best'
        ? ['ncValue', 'owlsPrice']
        : []; // no source configured — mapItemV2NcValue always omits the field

const JOINS: Record<JoinName, Prisma.Sql> = {
  color: Prisma.sql`
    LEFT JOIN ItemColor AS color
      ON color.image_id = a.image_id AND color.type = 'Vibrant'
  `,
  npPrice: Prisma.sql`
    LEFT JOIN ItemPrices AS npPrice
      ON npPrice.item_iid = a.internal_id AND npPrice.isLatest = 1
  `,
  ncValue: Prisma.sql`
    LEFT JOIN ncValues AS ncValue
      ON ncValue.item_iid = a.internal_id AND ncValue.isLatest = 1
  `,
  owlsPrice: Prisma.sql`
    LEFT JOIN owlsPrice AS owlsPrice
      ON owlsPrice.item_iid = a.internal_id AND owlsPrice.isLatest = 1
  `,
  ncMall: Prisma.sql`
    LEFT JOIN NcMallData AS ncMall
      ON ncMall.item_iid = a.internal_id AND ncMall.active = 1
  `,
  saleStats: Prisma.sql`
    LEFT JOIN SaleStats AS saleStats
      ON saleStats.item_iid = a.internal_id
     AND saleStats.isLatest = 1
     AND saleStats.stats != "unknown"
  `,
};

type FieldDefinition<K extends keyof ItemV2> = {
  columns: readonly ColumnName[];
  joins?: readonly JoinName[];
  map: (raw: RawItemV2Row, options: MapItemV2Options) => ItemV2[K];
};

type FieldDefinitions = {
  [K in keyof ItemV2]-?: FieldDefinition<K>;
};

/**
 * Single source of truth for every response field: SQL dependencies and mapper
 * live together, so changing the contract does not require parallel registries.
 */
const FIELD_DEFINITIONS: FieldDefinitions = {
  internal_id: {
    columns: ['internal_id'],
    map: (raw) => asNumber(raw.internal_id) ?? 0,
  },
  item_id: { columns: ['item_id'], map: (raw) => asNumber(raw.item_id) },
  name: { columns: ['name'], map: (raw) => asString(raw.name) ?? '' },
  description: {
    columns: ['description'],
    map: (raw) => asString(raw.description) ?? '',
  },
  image: {
    columns: ['image', 'image_id', 'imgCacheOverride'],
    map: mapImage,
  },
  category: { columns: ['category'], map: (raw) => asString(raw.category) },
  rarity: { columns: ['rarity'], map: (raw) => asNumber(raw.rarity) },
  weight: { columns: ['weight'], map: (raw) => asNumber(raw.weight) },
  type: { columns: ['type'], map: mapType },
  flags: {
    columns: [
      'isWearable',
      'isNeohome',
      'isBD',
      'flags',
      'item_id',
      'name',
      'image_id',
      'rarity',
      'category',
      'description',
      'est_val',
      'weight',
    ],
    map: mapFlags,
  },
  estVal: { columns: ['est_val'], map: (raw) => asNumber(raw.est_val) },
  status: { columns: ['status'], map: (raw) => asString(raw.status) },
  colorHex: {
    columns: ['colorHex'],
    joins: ['color'],
    map: (raw) => asString(raw.colorHex),
  },
  price: {
    columns: [
      'type',
      'status',
      'npPrice',
      'priceAddedAt',
      'priceInflationId',
      'priceManualCheck',
      'priceContext',
      'ncMallPrice',
      'ncMallSaleBegin',
      'ncMallSaleEnd',
      'ncMallDiscountBegin',
      'ncMallDiscountEnd',
      'ncMallDiscountPrice',
    ],
    joins: ['npPrice', 'ncMall'],
    map: mapItemV2Price,
  },
  ncValue: {
    columns: [
      'type',
      'status',
      'ncValueAddedAt',
      'ncValueMin',
      'ncValueMax',
      'ncValueRange',
      'owlsPricedAt',
      'owlsValue',
      'owlsValueMin',
    ],
    joins: NC_VALUE_JOINS,
    map: mapItemV2NcValue,
  },
  saleStatus: {
    columns: ['saleStats', 'saleAdded'],
    joins: ['saleStats'],
    map: mapSaleStatus,
  },
  slug: { columns: ['slug'], map: (raw) => asString(raw.slug) },
  comment: { columns: ['comment'], map: (raw) => asString(raw.comment) },
  canonical_id: {
    columns: ['canonical_id'],
    map: (raw) => asNumber(raw.canonical_id),
  },
  firstSeen: {
    columns: ['item_id', 'type', 'addedAt'],
    map: mapFirstSeen,
  },
  useTypes: {
    columns: ['canEat', 'canRead', 'canOpen', 'canPlay'],
    map: mapUseTypes,
  },
};

export function getItemV2QueryPlan(intent: ItemIntent) {
  const declared = getIntentFields(intent);
  // `full` always means every response field — take them from this registry so we
  // never maintain a second hand-written list of keys.
  const fields =
    declared === ALL_ITEM_V2_FIELDS
      ? (Object.keys(FIELD_DEFINITIONS) as (keyof ItemV2)[])
      : [...declared];
  const columns = new Set<ColumnName>();
  const joins = new Set<JoinName>();

  for (const field of fields) {
    const definition = FIELD_DEFINITIONS[field];
    definition.columns.forEach((column) => columns.add(column));
    definition.joins?.forEach((join) => joins.add(join));
  }

  return {
    fields,
    columns: [...columns],
    joins: [...joins],
  };
}

type ResolvedLookup = {
  where: Prisma.Sql;
  encodeKey: (raw: RawItemV2Row) => string;
};

/**
 * Builds WHERE + response key encoder for a `{ type, data }` query.
 * Keeping both in one switch prevents the filter and result keys from drifting.
 */
function resolveLookup(query: FindManyItemsV2Query): ResolvedLookup | null {
  if (!query.data.length) return null;

  switch (query.type) {
    case 'id':
      return {
        where: Prisma.sql`a.internal_id IN (${Prisma.join(query.data)})`,
        encodeKey: (raw) => String(raw.internal_id),
      };
    case 'item_id':
      return {
        where: Prisma.sql`a.item_id IN (${Prisma.join(query.data)})`,
        encodeKey: (raw) => String(raw.item_id),
      };
    case 'name_image_id': {
      const tuples = query.data.map(([name, imageId]) => Prisma.sql`(${name}, ${imageId})`);
      return {
        where: Prisma.sql`
          (a.name, a.image_id) IN (${Prisma.join(tuples)})
          AND a.canonical_id IS NULL
        `,
        encodeKey: (raw) => encodeNameImageKey(String(raw.name), String(raw.image_id)),
      };
    }
    case 'image_id':
      return {
        where: Prisma.sql`
          a.image_id IN (${Prisma.join(query.data)})
          AND a.canonical_id IS NULL
        `,
        encodeKey: (raw) => String(raw.image_id),
      };
    case 'name':
      return {
        where: Prisma.sql`
          a.name IN (${Prisma.join(query.data)})
          AND a.canonical_id IS NULL
        `,
        encodeKey: (raw) => String(raw.name),
      };
    case 'slug':
      return {
        where: Prisma.sql`a.slug IN (${Prisma.join(query.data)})`,
        encodeKey: (raw) => String(raw.slug),
      };
  }
}

function mapType(raw: RawItemV2Row): ItemV2['type'] {
  return raw.type === 'nc' || raw.type === 'pb' ? raw.type : 'np';
}

function mapFlags(raw: RawItemV2Row): ItemFlags[] {
  const flags: ItemFlags[] = [];
  if (raw.isWearable) flags.push('wearable');
  if (raw.isNeohome) flags.push('neohome');
  if (raw.isBD) flags.push('bd');

  // Missing information is computed from raw values before defaults hide nulls.
  const required = [
    raw.item_id,
    raw.name,
    raw.image_id,
    raw.rarity,
    raw.category,
    raw.description,
    raw.est_val,
    raw.weight,
  ];
  if (required.some((value) => value === null || value === undefined)) flags.push('missingInfo');

  // Items.flags is a comma-separated bag of free-form tags (e.g. "no-unknown").
  const stored = asString(raw.flags)
    ?.split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);
  if (stored?.length) flags.push(...stored);

  return flags;
}

function mapImage(raw: RawItemV2Row): ItemV2['image'] {
  const hash = asString(raw.imgCacheOverride);
  return {
    url: asString(raw.image) ?? '',
    id: asString(raw.image_id) ?? '',
    ...(hash ? { hash } : {}),
  };
}

function mapFirstSeen(raw: RawItemV2Row): ItemV2['firstSeen'] {
  const itemId = asNumber(raw.item_id);
  return itemId !== null && itemId >= 85020 && mapType(raw) !== 'pb'
    ? asJsonDate(raw.addedAt)
    : null;
}

function mapUseTypes(raw: RawItemV2Row): ItemV2['useTypes'] {
  return {
    canEat: (asString(raw.canEat) ?? 'unknown') as ItemV2['useTypes']['canEat'],
    canRead: (asString(raw.canRead) ?? 'unknown') as ItemV2['useTypes']['canRead'],
    canOpen: (asString(raw.canOpen) ?? 'unknown') as ItemV2['useTypes']['canOpen'],
    canPlay: (asString(raw.canPlay) ?? 'unknown') as ItemV2['useTypes']['canPlay'],
  };
}

const SALE_STATUS_VALUES = new Set<ItemSaleStatusV2['status']>(['ets', 'regular', 'hts']);

function mapSaleStatus(raw: RawItemV2Row): ItemV2['saleStatus'] {
  if (DISABLE_SALE_STATS) return null;

  const status = asString(raw.saleStats);
  if (!status || !SALE_STATUS_VALUES.has(status as ItemSaleStatusV2['status'])) return null;

  const addedAt = asJsonDate(raw.saleAdded);
  if (!addedAt) return null;

  return { status: status as ItemSaleStatusV2['status'], addedAt };
}

/**
 * Maps one database row directly to the requested DTO. No legacy ItemData
 * object is created, so omitted intent fields cannot leak into the response.
 */
export function mapItemV2<I extends ItemIntent>(
  raw: RawItemV2Row,
  intent: I,
  options: MapItemV2Options = {}
): ItemV2For<I> {
  const item = Object.fromEntries(
    getItemV2QueryPlan(intent)
      .fields.map((field) => [field, FIELD_DEFINITIONS[field].map(raw, options)] as const)
      // Optional fields (e.g. `ncValue`) map to `undefined` when absent — omit the
      // key entirely so the response never carries empty slots.
      .filter(([, value]) => value !== undefined)
  );

  return item as ItemV2For<I>;
}

async function queryItemV2Rows(where: Prisma.Sql, intent: ItemIntent, limit?: number) {
  const plan = getItemV2QueryPlan(intent);
  const select = Prisma.join(
    plan.columns.map((column) => RAW_COLUMNS[column]),
    ', '
  );
  const joins = plan.joins.length
    ? Prisma.join(
        plan.joins.map((join) => JOINS[join]),
        '\n'
      )
    : Prisma.empty;

  const limitSql = typeof limit === 'number' ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;

  return prisma.$queryRaw<RawItemV2Row[]>(Prisma.sql`
    SELECT ${select}
    FROM Items AS a
    ${joins}
    WHERE ${where}
    ${limitSql}
  `);
}

function buildItemLookupWhere(idName: number | string): Prisma.Sql {
  if (!Number.isNaN(Number(idName))) {
    return Prisma.sql`a.internal_id = ${idName}`;
  }

  // Match v1: slug exact, or name LIKE (exact unless the caller passes wildcards).
  return Prisma.sql`a.slug = ${idName} OR a.name LIKE ${idName}`;
}

/**
 * Single-item loader for HTTP `/api/v2/items/[id_name]`. Lookup mirrors v1
 * (internal_id, slug, or name) without side-effects (no NC refresh / saleStats).
 */
export async function getItemV2<I extends ItemIntent = 'full'>(
  idName: number | string,
  options: GetManyItemsV2Options<I> = {}
): Promise<ItemV2For<I> | null> {
  const intent = (options.intent ?? 'full') as I;
  const rows = await queryItemV2Rows(buildItemLookupWhere(idName), intent, 1);
  if (!rows.length) return null;
  return mapItemV2(rows[0], intent);
}

/**
 * Fetches ItemV2 records using only the columns and JOINs required by intent.
 * Pass a single `{ type, data }` lookup — response keys follow that type's encoding.
 */
export async function getManyItemsV2<I extends ItemIntent = 'full'>(
  query: FindManyItemsV2Query,
  options: GetManyItemsV2Options<I> = {}
): Promise<Record<string, ItemV2For<I>>> {
  const lookup = resolveLookup(query);
  if (!lookup) return {};

  const intent = (options.intent ?? 'full') as I;
  const limit = options.limit ?? 60_000;
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new RangeError('ItemV2 query limit must be a positive safe integer');
  }

  const rows = await queryItemV2Rows(lookup.where, intent, limit);

  const items: Record<string, ItemV2For<I>> = {};
  for (const row of rows) {
    items[lookup.encodeKey(row)] = mapItemV2(row, intent);
  }

  return items;
}
