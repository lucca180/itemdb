import queryString from 'query-string';
import type { FindManyItemsV2Query } from '@app/server/items/v2';

function asStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

function asNameImagePairs(value: unknown): [string, string][] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const pairs: [string, string][] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) return undefined;
    pairs.push([String(entry[0]), String(entry[1])]);
  }
  return pairs;
}

export function parseManyItemsV2Query(raw: Record<string, unknown>): FindManyItemsV2Query | null {
  const query: FindManyItemsV2Query = {
    id: asStringArray(raw.id),
    item_id: asStringArray(raw.item_id),
    name_image_id: asNameImagePairs(raw.name_image_id),
    image_id: asStringArray(raw.image_id),
    name: asStringArray(raw.name),
    slug: asStringArray(raw.slug),
  };

  const hasFilter = [
    query.id,
    query.item_id,
    query.name_image_id,
    query.image_id,
    query.name,
    query.slug,
  ].some((value) => !!value?.length);

  return hasFilter ? query : null;
}

export function parseManyItemsV2SearchParams(url: string): Record<string, unknown> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return queryString.parse(query, { arrayFormat: 'bracket' }) as Record<string, unknown>;
}
