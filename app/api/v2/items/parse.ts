import queryString from 'query-string';
import {
  FIND_MANY_ITEMS_V2_TYPES,
  type FindManyItemsV2Query,
  type FindManyItemsV2Type,
} from '@app/server/items/v2';

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

function isLookupType(value: unknown): value is FindManyItemsV2Type {
  return (
    typeof value === 'string' && (FIND_MANY_ITEMS_V2_TYPES as readonly string[]).includes(value)
  );
}

/**
 * v2 contract: `{ type, data }` only.
 * GET example: `?type=id&data[]=1&data[]=2&intent=minimal`
 */
export function parseManyItemsV2Query(
  rawParams: Record<string, unknown>
): FindManyItemsV2Query | null {
  if (!isLookupType(rawParams.type) || rawParams.data === undefined) return null;

  if (rawParams.type === 'name_image_id') {
    const data = asNameImagePairs(rawParams.data);
    return data?.length ? { type: 'name_image_id', data } : null;
  }

  const data = asStringArray(rawParams.data);
  return data?.length ? ({ type: rawParams.type, data } as FindManyItemsV2Query) : null;
}

export function parseManyItemsV2SearchParams(url: string): Record<string, unknown> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return queryString.parse(query, { arrayFormat: 'bracket' }) as Record<string, unknown>;
}
