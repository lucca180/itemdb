import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import {
  ALL_ITEM_V2_FIELDS,
  getIntentFields,
  type ItemFlags,
  type ItemIntent,
  type ItemV2,
  type ItemV2For,
} from '@types';
import { mapItemV2Price, type MapItemV2Options } from '@app/server/items/itemV2Price';
import { asJsonDate, asNumber, asString, type RawItemV2Row } from '@app/server/items/itemV2Raw';

export type { MapItemV2Options } from '@app/server/items/itemV2Price';
export type { RawItemV2Row } from '@app/server/items/itemV2Raw';

type Identifier = string | number;
type JoinName = 'color' | 'npPrice' | 'ncValue' | 'owlsPrice' | 'ncMall';
type ColumnName = keyof typeof RAW_COLUMNS;

export type FindManyItemsV2Query = {
  id?: Identifier[];
  item_id?: Identifier[];
  name_image_id?: [string, string][];
  image_id?: string[];
  name?: string[];
  slug?: string[];
};

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
} as const;

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
};

type FieldDefinition<K extends keyof ItemV2> = {
  columns: readonly ColumnName[];
  joins?: readonly JoinName[];
  map: (raw: RawItemV2Row, options: MapItemV2Options) => ItemV2[K];
};

type FieldDefinitions = {
  [K in keyof ItemV2]: FieldDefinition<K>;
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
      'ncValueAddedAt',
      'ncValueMin',
      'ncValueMax',
      'ncValueRange',
      'owlsPricedAt',
      'owlsValue',
      'owlsValueMin',
      'ncMallPrice',
      'ncMallSaleBegin',
      'ncMallSaleEnd',
      'ncMallDiscountBegin',
      'ncMallDiscountEnd',
      'ncMallDiscountPrice',
    ],
    joins: ['npPrice', 'ncValue', 'owlsPrice', 'ncMall'],
    map: mapItemV2Price,
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
  getKey: (raw: RawItemV2Row) => string;
};

/**
 * Resolves filter precedence and response indexing together. Keeping both in
 * one branch prevents the WHERE clause and result key from drifting apart.
 */
function resolveLookup(query: FindManyItemsV2Query): ResolvedLookup | null {
  if (query.id?.length) {
    return {
      where: Prisma.sql`a.internal_id IN (${Prisma.join(query.id)})`,
      getKey: (raw) => String(raw.internal_id),
    };
  }

  if (query.item_id?.length) {
    return {
      where: Prisma.sql`a.item_id IN (${Prisma.join(query.item_id)})`,
      getKey: (raw) => String(raw.item_id),
    };
  }

  if (query.name_image_id?.length) {
    const tuples = query.name_image_id.map(([name, imageId]) => Prisma.sql`(${name}, ${imageId})`);
    return {
      where: Prisma.sql`
        (a.name, a.image_id) IN (${Prisma.join(tuples)})
        AND a.canonical_id IS NULL
      `,
      getKey: (raw) => `${encodeURI(String(raw.name).toLowerCase())}_${String(raw.image_id)}`,
    };
  }

  if (query.image_id?.length) {
    return {
      where: Prisma.sql`
        a.image_id IN (${Prisma.join(query.image_id)})
        AND a.canonical_id IS NULL
      `,
      getKey: (raw) => String(raw.image_id),
    };
  }

  if (query.name?.length) {
    return {
      where: Prisma.sql`
        a.name IN (${Prisma.join(query.name)})
        AND a.canonical_id IS NULL
      `,
      getKey: (raw) => String(raw.name),
    };
  }

  if (query.slug?.length) {
    return {
      where: Prisma.sql`a.slug IN (${Prisma.join(query.slug)})`,
      getKey: (raw) => String(raw.slug),
    };
  }

  return null;
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
    getItemV2QueryPlan(intent).fields.map((field) => [
      field,
      FIELD_DEFINITIONS[field].map(raw, options),
    ])
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
 * Filters keep v1's precedence so callers can migrate without lookup changes.
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
    items[lookup.getKey(row)] = mapItemV2(row, intent);
  }

  return items;
}
