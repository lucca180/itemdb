import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getAllNeopetsColors } from '@app/server/petColors';
import { ItemService } from '@services/ItemService';
import { PET_COLORS_CACHE_TAG, allSpecies, findPetColorName, petColorSlug } from '@utils/pet-utils';
import { petPreviewUrl } from '@utils/petColorTool';
import { colorNameSearchTerms, textHasColorToken } from '@utils/petStyles';
import prisma from '@utils/prisma';
import type { ItemV2For, LebronTrade, NCValue } from '@types';
import { Prisma } from '@prisma/generated/client';
import type { StyleComboTile, StyleToken } from '@utils/petStyles/display';
import {
  PET_STYLES_PAGE_SIZE,
  UNKNOWN_COLOR_NAME,
  isUnknownColorName,
  stylesComboHref,
} from '@utils/petStyles/paths';
import { loadLebronTradeHistory } from '@app/_components/Item/loadUtils';
import { prepareNCTradeHistory } from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';

/** Displayable styles: known species, resolved parse. Colour may be null (colour-agnostic). */
const DISPLAYABLE_STYLE: Prisma.PetStyleWhereInput = {
  species_id: { not: null },
  needsReview: false,
};

/** Stable “newest first”: discovery date, then style row time, then iid. */
const NEWEST_STYLE_ORDER = [
  { item: { addedAt: 'desc' as const } },
  { addedAt: 'desc' as const },
  { item_iid: 'desc' as const },
];

function colorMatchOrFilters(
  colorId: number,
  stringFilters: Prisma.PetStyleWhereInput[]
): Prisma.PetStyleWhereInput[] {
  // Paint / themed colour pages: matched colour (+ name tokens). Colour-agnostic
  // styles live under `/{species}/unknown` instead.
  return [{ color_id: colorId }, ...stringFilters];
}

/** Aligns with item trade-list “active owner” window (`lists.ts`). */
const TRADE_LIST_ACTIVE_MS = 180 * 24 * 60 * 60 * 1000;
const COMBO_TRADE_SAMPLE_LIMIT = 3;
/** Soft cap when deriving browse combo tiles (not the token grid). */
const COMBO_SOURCE_CAP = 500;

export type ComboPetStyleGroup = {
  series: string;
  items: ItemV2For<'card'>[];
};

export type PetStyleHubFilters = {
  series?: string | null;
  prismaticOnly?: boolean;
  availableNowOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type PetStyleTokenPage = {
  tokens: StyleToken[];
  total: number;
  page: number;
  pageSize: number;
};

type StyleRow = {
  item_iid: number;
  series: string;
  isPrismatic: boolean;
  prismaticVariant: string | null;
};

type TokenSourceRow = {
  item_iid: number;
  series: string;
  isPrismatic: boolean;
  prismaticVariant: string | null;
  species_id: number | null;
  color_id: number | null;
  inStudio: boolean;
  item: {
    name: string;
    slug: string | null;
    image_id: string | null;
    image: string | null;
    addedAt: Date;
  };
};

type TradeCounts = {
  seekingCount: number;
  tradingCount: number;
  ncTradeCount: number;
};

type LebronTradeBundle = {
  samples: LebronTrade[];
  count: number;
};

function colorStringOrFilters(terms: string[]): Prisma.PetStyleWhereInput[] {
  return terms.flatMap((term) => [
    { series: { contains: term } },
    { item: { name: { contains: term } } },
  ]);
}

function wearablePreviewUrl(imageId: string | null | undefined): string {
  if (!imageId) return '';
  return `https://cdn.itemdb.com.br/preview/${imageId}.png`;
}

function itemIconUrl(
  imageId: string | null | undefined,
  imageUrl: string | null | undefined
): string {
  if (imageId) return `https://cdn.itemdb.com.br/items/${imageId}.gif`;
  if (imageUrl) return imageUrl;
  return 'https://images.neopets.com/items/mall_styletoken.gif';
}

function emptyCounts(): TradeCounts {
  return { seekingCount: 0, tradingCount: 0, ncTradeCount: 0 };
}

function groupStylesBySeries(
  rows: StyleRow[],
  items: Record<string, ItemV2For<'card'>>
): ComboPetStyleGroup[] {
  const bySeries = new Map<string, StyleRow[]>();

  for (const row of rows) {
    const list = bySeries.get(row.series) ?? [];
    list.push(row);
    bySeries.set(row.series, list);
  }

  const seriesNames = [...bySeries.keys()].sort((a, b) => a.localeCompare(b));

  return seriesNames
    .map((series) => {
      const seriesRows = (bySeries.get(series) ?? []).sort((a, b) => {
        if (a.isPrismatic !== b.isPrismatic) return a.isPrismatic ? 1 : -1;
        return (a.prismaticVariant ?? '').localeCompare(b.prismaticVariant ?? '');
      });

      const groupItems = seriesRows
        .map((row) => items[String(row.item_iid)])
        .filter((item): item is ItemV2For<'card'> => item != null);

      return { series, items: groupItems };
    })
    .filter((group) => group.items.length > 0);
}

async function resolveColorNames(
  colorIds: Array<number | null | undefined>
): Promise<Record<number, string>> {
  const ids = [...new Set(colorIds.filter((id): id is number => id != null))];
  if (!ids.length) return {};
  const catalog = await getAllNeopetsColors();
  const out: Record<number, string> = {};
  for (const id of ids) {
    const name = findPetColorName(id, catalog);
    if (name) out[id] = name;
  }
  return out;
}

function mapTokenRows(
  rows: TokenSourceRow[],
  colorNames: Record<number, string>,
  countsByIid: Record<number, TradeCounts> = {},
  tradesByIid: Record<number, LebronTradeBundle> = {},
  ncValueByIid: Record<number, NCValue> = {}
): StyleToken[] {
  const tokens: StyleToken[] = [];

  for (const row of rows) {
    // Color may be null (Essence / All-Star Essence — colour-agnostic tokens).
    if (row.species_id == null) continue;
    const speciesName = allSpecies[String(row.species_id)];
    if (!speciesName) continue;

    const colorName =
      row.color_id != null ? (colorNames[row.color_id] ?? null) : UNKNOWN_COLOR_NAME;
    if (row.color_id != null && !colorName) continue;

    const counts = countsByIid[row.item_iid] ?? emptyCounts();
    const tradeBundle = tradesByIid[row.item_iid];
    tokens.push({
      id: row.item_iid,
      name: row.item.name,
      series: row.series,
      speciesName,
      colorName,
      isPrismatic: row.isPrismatic,
      prismaticVariant: row.prismaticVariant,
      inStudio: row.inStudio,
      seekingCount: counts.seekingCount,
      tradingCount: counts.tradingCount,
      ncTradeCount: tradeBundle?.count ?? counts.ncTradeCount,
      trades: tradeBundle?.samples ?? [],
      ncValue: ncValueByIid[row.item_iid] ?? null,
      imageUrl: itemIconUrl(row.item.image_id, row.item.image),
      previewUrl: wearablePreviewUrl(row.item.image_id),
      imageId: row.item.image_id ?? null,
      itemSlug: row.item.slug || petColorSlug(row.item.name),
      releasedAt: row.item.addedAt.toISOString().slice(0, 10),
    });
  }

  return tokens;
}

/** Batch Lebron / itemdb NC values via card intent (respects `NC_VALUES_TYPE`). */
async function loadNcValuesByItemIids(iids: number[]): Promise<Record<number, NCValue>> {
  if (!iids.length) return {};

  const unique = [...new Set(iids)];
  const items = await ItemService.getManyItems(
    { type: 'id', data: unique },
    { intent: 'card', limit: unique.length }
  );

  const out: Record<number, NCValue> = {};
  for (const iid of unique) {
    const value = items[String(iid)]?.ncValue;
    if (value) out[iid] = value;
  }
  return out;
}

const tokenSelect = {
  item_iid: true,
  series: true,
  isPrismatic: true,
  prismaticVariant: true,
  species_id: true,
  color_id: true,
  item: {
    select: {
      name: true,
      slug: true,
      image_id: true,
      image: true,
      addedAt: true,
    },
  },
  availability: {
    where: { active: true },
    select: { active: true },
    take: 1,
  },
} as const;

function withInStudio<T extends { availability: { active: boolean | null }[] }>(
  row: T
): Omit<T, 'availability'> & { inStudio: boolean } {
  const { availability, ...rest } = row;
  return { ...rest, inStudio: availability.length > 0 };
}

/**
 * Batch seeking / trading counts for item pages.
 * Matches NCTrade tab filters: public, non-official, purpose seeking|trading, owner active 180d.
 * Trade-report counts come from Lebron (see {@link loadLebronTradeSamplesByItems}).
 */
async function loadTradeCountsByItemIids(iids: number[]): Promise<Record<number, TradeCounts>> {
  if (!iids.length) return {};

  const unique = [...new Set(iids)];
  const result: Record<number, TradeCounts> = {};
  for (const iid of unique) result[iid] = emptyCounts();

  const cutoff = new Date(Date.now() - TRADE_LIST_ACTIVE_MS);

  const listRows = await prisma.$queryRaw<
    Array<{ item_iid: number; purpose: string; cnt: bigint }>
  >`
    SELECT li.item_iid AS item_iid, ul.purpose AS purpose, COUNT(*) AS cnt
    FROM ListItems li
    INNER JOIN UserList ul ON ul.internal_id = li.list_id
    INNER JOIN User u ON u.id = ul.user_id
    WHERE li.item_iid IN (${Prisma.join(unique)})
      AND li.isHidden = 0
      AND ul.official = 0
      AND ul.visibility = 'public'
      AND ul.purpose IN ('seeking', 'trading')
      AND u.last_login > ${cutoff}
    GROUP BY li.item_iid, ul.purpose
  `;

  for (const row of listRows) {
    const bucket = result[row.item_iid] ?? emptyCounts();
    const count = Number(row.cnt);
    if (row.purpose === 'seeking') bucket.seekingCount = count;
    if (row.purpose === 'trading') bucket.tradingCount = count;
    result[row.item_iid] = bucket;
  }

  return result;
}

/**
 * Lebron NC trade samples — same source/prep as the item page NC Trade history tab
 * (`loadLebronTradeHistory` + `prepareNCTradeHistory`).
 */
async function loadLebronTradeSamplesByItems(
  items: Array<{ iid: number; name: string }>,
  perItemLimit = COMBO_TRADE_SAMPLE_LIMIT
): Promise<Record<number, LebronTradeBundle>> {
  if (!items.length) return {};

  const unique = new Map<number, string>();
  for (const item of items) {
    if (!unique.has(item.iid)) unique.set(item.iid, item.name);
  }

  const entries = await Promise.all(
    [...unique.entries()].map(async ([iid, name]) => {
      const reports = await loadLebronTradeHistory(iid, name);
      const prepared = prepareNCTradeHistory(reports, []);
      return [
        iid,
        {
          count: prepared.length,
          samples: prepared.slice(0, perItemLimit),
        } satisfies LebronTradeBundle,
      ] as const;
    })
  );

  return Object.fromEntries(entries);
}

function matchesColorToken(
  colorId: number,
  terms: string[],
  row: { color_id: number | null; series: string; item: { name: string } }
): boolean {
  if (row.color_id == null) return false;
  if (row.color_id === colorId) return true;
  return terms.some(
    (term) => textHasColorToken(row.series, term) || textHasColorToken(row.item.name, term)
  );
}

function comboTilesFromTokens(tokens: StyleToken[]): StyleComboTile[] {
  const map = new Map<string, StyleComboTile>();

  for (const token of tokens) {
    const key = `${token.speciesName}::${token.colorName}`;
    const existing = map.get(key);
    const released = new Date(token.releasedAt);
    if (existing) {
      existing.styleCount += 1;
      if (released > existing.addedAt) existing.addedAt = released;
      continue;
    }

    const speciesId = Object.entries(allSpecies).find(
      ([, name]) => name === token.speciesName
    )?.[0];
    map.set(key, {
      speciesId: speciesId ? Number(speciesId) : 0,
      colorId: 0,
      speciesName: token.speciesName,
      colorName: token.colorName,
      // Unknown has no OpenNeo colour body — use the style wearable preview.
      previewUrl: isUnknownColorName(token.colorName)
        ? token.previewUrl
        : petPreviewUrl(token.speciesName, token.colorName),
      href: stylesComboHref(token.speciesName, token.colorName),
      addedAt: released,
      styleCount: 1,
    });
  }

  return [...map.values()].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
}

/**
 * PetStyles for a Rainbow Pool paint combo (species × colour).
 * Matches `color_id`, colour name tokens, and colour-agnostic (`color_id` null) styles
 * (those also have a dedicated `/{species}/unknown` page in Pet Styles).
 * Groups by series (base then prismatics).
 */
export async function loadComboPetStyles(
  speciesId: number | null | undefined,
  colorId: number | null | undefined,
  colorName?: string | null
): Promise<ComboPetStyleGroup[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  if (speciesId == null || colorId == null) return [];

  const terms = colorNameSearchTerms(colorName);
  const stringFilters = colorStringOrFilters(terms);

  const rows = await prisma.petStyle.findMany({
    where: {
      species_id: speciesId,
      needsReview: false,
      OR: [{ color_id: colorId }, ...stringFilters],
    },
    select: {
      item_iid: true,
      series: true,
      isPrismatic: true,
      prismaticVariant: true,
      color_id: true,
      item: { select: { name: true } },
    },
  });

  const matched = rows.filter((row) => matchesColorToken(colorId, terms, row));

  if (!matched.length) return [];

  const iids = [...new Set(matched.map((row) => row.item_iid))];
  const items = await ItemService.getManyItems(
    { type: 'id', data: iids },
    { intent: 'card', limit: iids.length }
  );

  return groupStylesBySeries(matched, items);
}

export async function loadPetStyleSeriesCatalog(): Promise<string[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const rows = await prisma.petStyle.findMany({
    where: DISPLAYABLE_STYLE,
    distinct: ['series'],
    select: { series: true },
    orderBy: { series: 'asc' },
  });

  return rows.map((row) => row.series);
}

/** Resolve hub `?series=` slug to the stored series name. */
export async function resolvePetStyleSeriesSlug(slug: string | undefined): Promise<string | null> {
  if (!slug) return null;
  const catalog = await loadPetStyleSeriesCatalog();
  return catalog.find((series) => petColorSlug(series) === petColorSlug(slug)) ?? null;
}

/** Recent tokens by item discovery date (`Items.addedAt`). No seeking/trading batch. */
export async function loadRecentlyReleasedPetStyles(
  limit = 24,
  opts: { ncValues?: boolean } = {}
): Promise<StyleToken[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const includeNcValues = opts.ncValues !== false;

  const rows = await prisma.petStyle.findMany({
    where: DISPLAYABLE_STYLE,
    orderBy: NEWEST_STYLE_ORDER,
    take: limit,
    select: tokenSelect,
  });

  const mapped = rows.map(withInStudio);
  const colorNames = await resolveColorNames(mapped.map((row) => row.color_id));
  const ncValues = includeNcValues
    ? await loadNcValuesByItemIids(mapped.map((row) => row.item_iid))
    : {};
  return mapTokenRows(mapped, colorNames, {}, {}, ncValues);
}

function applyListFilters(
  where: Prisma.PetStyleWhereInput,
  filters: PetStyleHubFilters
): Prisma.PetStyleWhereInput {
  if (filters.series) where.series = filters.series;
  if (filters.prismaticOnly) where.isPrismatic = true;
  if (filters.availableNowOnly) {
    where.availability = { some: { active: true } };
  }
  return where;
}

function listPageSize(filters: PetStyleHubFilters): number {
  const size = filters.pageSize ?? PET_STYLES_PAGE_SIZE;
  return Math.min(Math.max(1, size), PET_STYLES_PAGE_SIZE);
}

function clampListPage(page: number | undefined, total: number, pageSize: number): number {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page ?? 1), pageCount);
}

async function loadTokenPage(
  where: Prisma.PetStyleWhereInput,
  filters: PetStyleHubFilters
): Promise<PetStyleTokenPage> {
  const pageSize = listPageSize(filters);
  const total = await prisma.petStyle.count({ where });
  const page = clampListPage(filters.page, total, pageSize);

  const rows =
    total === 0
      ? []
      : await prisma.petStyle.findMany({
          where,
          orderBy: NEWEST_STYLE_ORDER,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: tokenSelect,
        });

  const mapped = rows.map(withInStudio);
  const iids = mapped.map((row) => row.item_iid);
  const [colorNames, ncValues] = await Promise.all([
    resolveColorNames(mapped.map((row) => row.color_id)),
    loadNcValuesByItemIids(iids),
  ]);
  return {
    tokens: mapTokenRows(mapped, colorNames, {}, {}, ncValues),
    total,
    page,
    pageSize,
  };
}

async function loadComboTilesForWhere(where: Prisma.PetStyleWhereInput): Promise<StyleComboTile[]> {
  const rows = await prisma.petStyle.findMany({
    where,
    orderBy: NEWEST_STYLE_ORDER,
    take: COMBO_SOURCE_CAP,
    select: tokenSelect,
  });
  const mapped = rows.map(withInStudio);
  const colorNames = await resolveColorNames(mapped.map((row) => row.color_id));
  return comboTilesFromTokens(mapTokenRows(mapped, colorNames));
}

/** Hub / search list: series / Prismatic / Available Now, server-paginated. */
export async function searchPetStylesHub(
  filters: PetStyleHubFilters = {}
): Promise<PetStyleTokenPage> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  return loadTokenPage(applyListFilters({ ...DISPLAYABLE_STYLE }, filters), filters);
}

/** Species browse: paginated tokens + combo tiles derived from the same filters. */
export async function loadPetStylesBrowseBySpecies(
  speciesId: number,
  filters: PetStyleHubFilters = {}
): Promise<{
  tokens: StyleToken[];
  combos: StyleComboTile[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  if (!allSpecies[String(speciesId)]) return null;

  const where = applyListFilters({ ...DISPLAYABLE_STYLE, species_id: speciesId }, filters);
  const [tokenPage, combos] = await Promise.all([
    loadTokenPage(where, filters),
    loadComboTilesForWhere(where),
  ]);

  return { ...tokenPage, combos };
}

/**
 * Colour browse: `color_id` OR colour name token in series / item name.
 * Special colour `Unknown`: all colour-agnostic styles (`color_id` null).
 */
export async function loadPetStylesBrowseByColor(
  colorId: number | null,
  colorName: string,
  filters: PetStyleHubFilters = {}
): Promise<{
  tokens: StyleToken[];
  combos: StyleComboTile[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  if (isUnknownColorName(colorName)) {
    const where = applyListFilters({ ...DISPLAYABLE_STYLE, color_id: null }, filters);
    const [tokenPage, combos] = await Promise.all([
      loadTokenPage(where, filters),
      loadComboTilesForWhere(where),
    ]);
    return { ...tokenPage, combos };
  }

  if (colorId == null) return null;

  const terms = colorNameSearchTerms(colorName);
  if (!terms.length) return null;

  const stringFilters = colorStringOrFilters(terms);
  const where = applyListFilters(
    {
      ...DISPLAYABLE_STYLE,
      color_id: { not: null },
      OR: [{ color_id: colorId }, ...stringFilters],
    },
    filters
  );

  // Token match needs a post-filter, so page in memory after the SQL candidate set.
  const rows = await prisma.petStyle.findMany({
    where,
    orderBy: NEWEST_STYLE_ORDER,
    select: tokenSelect,
  });
  const matched = rows.filter((row) => matchesColorToken(colorId, terms, row)).map(withInStudio);
  const colorNames = await resolveColorNames(matched.map((row) => row.color_id));
  // Map without NC values first so we can page, then enrich only the visible slice.
  const allTokens = mapTokenRows(matched, colorNames);

  const pageSize = listPageSize(filters);
  const total = allTokens.length;
  const page = clampListPage(filters.page, total, pageSize);
  const start = (page - 1) * pageSize;
  const pageTokens = allTokens.slice(start, start + pageSize);
  const ncValues = await loadNcValuesByItemIids(pageTokens.map((token) => token.id));

  return {
    tokens: pageTokens.map((token) => ({
      ...token,
      ncValue: ncValues[token.id] ?? null,
    })),
    combos: comboTilesFromTokens(allTokens),
    total,
    page,
    pageSize,
  };
}

/** Recent species×colour combos that have styles (hub secondary grid). */
export async function loadRecentPetStyleCombos(limit = 8): Promise<StyleComboTile[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const recent = await loadRecentlyReleasedPetStyles(Math.max(limit * 6, 48), {
    ncValues: false,
  });
  return comboTilesFromTokens(recent)
    .filter((combo) => !isUnknownColorName(combo.colorName))
    .slice(0, limit);
}

/**
 * Species × colour styles page: tokens with Studio flag, seeking/trading/NC counts,
 * and a few expandable trade samples.
 * Pass `colorId: null` + `colorName: Unknown` for colour-agnostic styles only.
 */
export async function loadPetStylesComboDetail(
  speciesId: number | null | undefined,
  colorId: number | null | undefined,
  colorName?: string | null
): Promise<StyleToken[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  if (speciesId == null) return [];

  const unknownMode = isUnknownColorName(colorName);
  if (!unknownMode && colorId == null) return [];

  const rows = unknownMode
    ? await prisma.petStyle.findMany({
        where: { ...DISPLAYABLE_STYLE, species_id: speciesId, color_id: null },
        select: tokenSelect,
      })
    : await prisma.petStyle.findMany({
        where: {
          ...DISPLAYABLE_STYLE,
          species_id: speciesId,
          OR: colorMatchOrFilters(colorId!, colorStringOrFilters(colorNameSearchTerms(colorName))),
        },
        select: tokenSelect,
      });

  const matched = unknownMode
    ? rows.map(withInStudio)
    : rows
        .filter((row) => matchesColorToken(colorId!, colorNameSearchTerms(colorName), row))
        .map(withInStudio);

  if (!matched.length) return [];

  const iids = matched.map((row) => row.item_iid);
  const [colorNames, counts, trades, ncValues] = await Promise.all([
    resolveColorNames(matched.map((row) => row.color_id)),
    loadTradeCountsByItemIids(iids),
    loadLebronTradeSamplesByItems(
      matched.map((row) => ({ iid: row.item_iid, name: row.item.name }))
    ),
    loadNcValuesByItemIids(iids),
  ]);

  return mapTokenRows(matched, colorNames, counts, trades, ncValues).sort((a, b) => {
    const seriesCmp = a.series.localeCompare(b.series);
    if (seriesCmp !== 0) return seriesCmp;
    if (a.isPrismatic !== b.isPrismatic) return a.isPrismatic ? 1 : -1;
    return (a.prismaticVariant ?? '').localeCompare(b.prismaticVariant ?? '');
  });
}

import { STUDIO_ESSENTIAL_ITEM_NAMES } from '@utils/petStyles/studioEssentials';

/** Official Studio consumables linked from the Pet Styles hub (omit if missing in DB). */
export { STUDIO_ESSENTIAL_ITEM_NAMES };

export type StudioEssentialItem = {
  name: string;
  slug: string;
  imageUrl: string;
  blurbKey:
    | 'supplies-blurb-sss'
    | 'supplies-blurb-deluxe'
    | 'supplies-blurb-prismatic'
    | 'supplies-blurb-deluxe-prismatic'
    | 'supplies-blurb-restyle';
};

const STUDIO_ESSENTIAL_BLURB_KEYS: Record<
  (typeof STUDIO_ESSENTIAL_ITEM_NAMES)[number],
  StudioEssentialItem['blurbKey']
> = {
  'Styling Studio Supplies': 'supplies-blurb-sss',
  'Deluxe Styling Studio Supplies': 'supplies-blurb-deluxe',
  'Styling Studio Prismatic Brush': 'supplies-blurb-prismatic',
  'Styling Studio Deluxe Prismatic Brush': 'supplies-blurb-deluxe-prismatic',
  'Styling Studio Restyle Paint': 'supplies-blurb-restyle',
};

export async function loadStudioEssentialItems(): Promise<StudioEssentialItem[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });

  const byName = await ItemService.getManyItems(
    { type: 'name', data: [...STUDIO_ESSENTIAL_ITEM_NAMES] },
    { intent: 'card', cached: true }
  );

  const out: StudioEssentialItem[] = [];
  for (const name of STUDIO_ESSENTIAL_ITEM_NAMES) {
    const item = byName[name];
    if (!item?.slug) continue;
    out.push({
      name: item.name,
      slug: item.slug,
      imageUrl: item.image.url,
      blurbKey: STUDIO_ESSENTIAL_BLURB_KEYS[name],
    });
  }
  return out;
}
