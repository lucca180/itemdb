export type DyeworksColorVariant = {
  item_id: number;
  color: string;
  hex: string;
  image: string;
  /** `null` when permanent / no end; otherwise raw `mm/dd` from Neopets. */
  end: string | null;
};

export type DyeworksSnapshotItem = {
  item_id: number;
  name: string;
  image: string;
  /** `null` when permanent / no end; otherwise raw `mm/dd` from Neopets. */
  end: string | null;
  categoryId: number;
  categoryName: string;
  colors: DyeworksColorVariant[];
};

type RawColor = {
  color?: string;
  hex?: string;
  image?: string;
  end?: boolean | string;
};

type RawItem = {
  name?: string;
  image?: string;
  end?: boolean | string;
  colors?: Record<string, RawColor>;
};

type RawCategory = {
  name?: string;
  items?: Record<string, RawItem>;
};

/** Keep only Neopets `mm/dd` end strings; `false` / invalid → null. */
export function normalizeDyeworksEnd(end: unknown): string | null {
  if (typeof end !== 'string') return null;
  const trimmed = end.trim();
  return /^\d{1,2}\/\d{1,2}$/.test(trimmed) ? trimmed : null;
}

/** Extract the `var categories = {...}` object literal from the Dyeworks HTML. */
export function extractCategoriesLiteral(html: string): string {
  const match = html.match(/var\s+categories\s*=\s*(\{)/);
  if (!match || match.index == null) {
    throw new Error('categories object not found in dyeworks HTML');
  }

  const start = match.index + match[0].length - 1;
  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }

  throw new Error('categories object is truncated');
}

/** Parse the JS object literal Neopets embeds (unquoted keys / bare booleans). */
export function parseCategoriesLiteral(literal: string): Record<string, RawCategory> {
  try {
    // Controlled Neopets page content — evaluate as an expression, not free JS.
    const parsed = new Function(`"use strict"; return (${literal});`)();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('categories is not an object');
    }
    return parsed as Record<string, RawCategory>;
  } catch (e) {
    throw new Error(
      `failed to parse categories literal: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/** Flatten category → base items currently listed in Dyeworks. */
export function flattenDyeworksCategories(
  categories: Record<string, RawCategory>
): DyeworksSnapshotItem[] {
  const items: DyeworksSnapshotItem[] = [];

  for (const [categoryIdRaw, category] of Object.entries(categories)) {
    const categoryId = Number(categoryIdRaw);
    const categoryName = category?.name ?? '';
    const categoryItems = category?.items ?? {};

    for (const [itemIdRaw, item] of Object.entries(categoryItems)) {
      const item_id = Number(itemIdRaw);
      if (!Number.isFinite(item_id) || !item?.name || !item?.image) continue;

      const colors: DyeworksColorVariant[] = [];
      for (const [colorIdRaw, color] of Object.entries(item.colors ?? {})) {
        const colorId = Number(colorIdRaw);
        if (!Number.isFinite(colorId) || !color?.image) continue;
        colors.push({
          item_id: colorId,
          color: color.color ?? '',
          hex: color.hex ?? '',
          image: color.image,
          end: normalizeDyeworksEnd(color.end),
        });
      }

      items.push({
        item_id,
        name: item.name,
        image: item.image,
        end: normalizeDyeworksEnd(item.end),
        categoryId: Number.isFinite(categoryId) ? categoryId : 0,
        categoryName,
        colors,
      });
    }
  }

  return items;
}

export function parseDyeworksHtml(html: string): DyeworksSnapshotItem[] {
  const literal = extractCategoriesLiteral(html);
  const categories = parseCategoriesLiteral(literal);
  return flattenDyeworksCategories(categories);
}

export type DyeworksListEntryKind = 'original' | 'color';

/** Flat list entry used for matching / list sync (base item or dye color variant). */
export type DyeworksListEntry = {
  item_id: number;
  name: string;
  image: string;
  kind: DyeworksListEntryKind;
  /** Raw `mm/dd` end date from Neopets, if any. */
  end: string | null;
};

/** Expand base items + their color variants into sync entries. */
export function expandDyeworksEntries(items: DyeworksSnapshotItem[]): DyeworksListEntry[] {
  const entries: DyeworksListEntry[] = [];

  for (const item of items) {
    entries.push({
      item_id: item.item_id,
      name: item.name,
      image: item.image,
      kind: 'original',
      end: item.end,
    });

    for (const color of item.colors) {
      entries.push({
        item_id: color.item_id,
        name: color.color ? `Dyeworks ${color.color}: ${item.name}` : item.name,
        image: color.image,
        kind: 'color',
        end: color.end,
      });
    }
  }

  return entries;
}
