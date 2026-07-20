import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@utils/prisma', () => ({
  default: { $queryRaw: vi.fn() },
}));

import { getItemV2QueryPlan } from '@app/server/items/v2';
import { itemIntents, type ItemIntent } from '@types';
import { defaultFilters } from '@utils/parseFilters';

/**
 * `openapi/v2.json` is hand-maintained (see its `info.description`). This test
 * is the guardrail: it fails if `components.schemas.ItemV2<Intent>` drifts from
 * the actual field lists the HTTP layer serves — `getItemV2QueryPlan(intent)`
 * is the same function `app/server/items/v2.ts` uses to build the SQL query,
 * so it's the real contract, not a second hand-maintained list.
 */
const openapi = JSON.parse(readFileSync(resolve(__dirname, '../openapi/v2.json'), 'utf-8')) as {
  components: {
    schemas: Record<string, { properties?: Record<string, unknown>; enum?: string[] }>;
  };
  paths: Record<string, Record<string, { parameters?: { name: string }[] }>>;
};

const SCHEMA_NAME_BY_INTENT: Record<ItemIntent, string> = {
  minimal: 'ItemV2Minimal',
  card: 'ItemV2Card',
  pricer: 'ItemV2Pricer',
  full: 'ItemV2Full',
};

describe('openapi/v2.json stays in sync with itemIntents', () => {
  test('components.schemas.ItemIntent enum matches itemIntents keys', () => {
    const schema = openapi.components.schemas.ItemIntent;
    expect(schema, 'openapi/v2.json is missing components.schemas.ItemIntent').toBeDefined();
    expect([...(schema.enum ?? [])].sort()).toEqual(Object.keys(itemIntents).sort());
  });

  test.each(Object.keys(itemIntents) as ItemIntent[])('intent "%s"', (intent) => {
    const schemaName = SCHEMA_NAME_BY_INTENT[intent];
    expect(
      schemaName,
      `No ItemV2* schema mapped for intent "${intent}" — update SCHEMA_NAME_BY_INTENT and openapi/v2.json.`
    ).toBeDefined();

    const schema = openapi.components.schemas[schemaName];
    expect(schema, `openapi/v2.json is missing components.schemas.${schemaName}`).toBeDefined();

    const expectedFields = getItemV2QueryPlan(intent).fields;
    const actualFields = Object.keys(schema.properties ?? {});

    expect(actualFields.sort()).toEqual([...expectedFields].sort());
  });

  test('every ItemIntent has a mapped schema', () => {
    expect(Object.keys(SCHEMA_NAME_BY_INTENT).sort()).toEqual(Object.keys(itemIntents).sort());
  });
});

/**
 * `/api/v2/search` passes the whole query string through as `SearchFilters`
 * (`ItemService.search(query, reqQuery as SearchFilters, ...)` in
 * `app/api/v2/search/route.ts`), so every `SearchFilters` key is a real,
 * usable query param. `defaultFilters` (`utils/parseFilters.ts`) is the
 * runtime object with those keys — same role as `itemIntents` above, just for
 * the search endpoint instead of the item shape.
 */
describe('openapi/v2.json "/api/v2/search" params stay in sync with SearchFilters', () => {
  // Params the v2 route adds on top of `SearchFilters` (query text + v2-only options).
  const NON_FILTER_PARAMS = ['s', 'intent', 'includeStats'];

  test('declared query params match SearchFilters keys + v2-only params', () => {
    const searchGet = openapi.paths['/api/v2/search']?.get;
    expect(searchGet, 'openapi/v2.json is missing GET /api/v2/search').toBeDefined();

    const declaredParams = (searchGet?.parameters ?? []).map((param) => param.name);
    const expectedParams = [...Object.keys(defaultFilters), ...NON_FILTER_PARAMS];

    expect(declaredParams.sort()).toEqual(expectedParams.sort());
  });
});
