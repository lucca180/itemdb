# API v2 — ItemV2 + Intents Migration

This migration is expected to take **several weeks**. v1 (`ItemData` + `/api/v1`) stays stable; v2 is opt-in.

## Goals

1. **New HTTP contract** (`ItemV2`) — breaking reshape, not just fewer fields.
2. **Intents** — presets in `itemIntents` (`minimal` | `card` | `full` | `pricer`); query engine derives JOINs from the fields each intent needs.
3. **Typing** — UI consumes `ItemV2`; `ItemData` becomes `@deprecated`.
4. **Lean layout:** legacy types under `/types` (file moved intact); ItemV2 helpers/registry under `/types`; server runtime under `app/server/items/`; client helpers in `utils/item/v2.ts`; HTTP in `route.ts`.
5. **Coexistence** — no breaking changes to `/api/v1` during the migration.

## Current problem

- [`pages/api/v1/items/many.ts`](../pages/api/v1/items/many.ts) always runs ~6 LEFT JOINs and `rawToItemData` builds the full envelope.
- Cards/lists use ~12 fields but still pay for SaleStats, NC values, mall, color lab/hsv, etc.
- Search already has conditional joins in [`utils/search/queryBuilder.ts`](../utils/search/queryBuilder.ts) — for filter/sort only, not response shape.
- There is no HTTP `/api/v2`. App Router `getItemV2` is a server-side loader, **not** a public API.

```mermaid
flowchart LR
  subgraph v1 [v1 ItemData]
    A1[Legacy shape]
    A2[Always 6 JOINs]
  end
  subgraph v2 [v2 ItemV2]
    B1[New contract]
    B2[Intent → fields]
    B3[Query engine picks JOINs]
    B4[Mapper raw to ItemV2]
  end
  v1 -.->|coexists| v2
  B2 --> B3
  B3 --> RawSQL[SQL]
  RawSQL --> B4
```
---

## `ItemV2` contract (locked)

Lives in [`types/itemV2.ts`](../types/itemV2.ts) (not in the legacy blob). Re-exported via `@types`.

```ts
export type ItemSaleStatusV2 = {
  status: 'ets' | 'regular' | 'hts';
  addedAt: string;
};

export type ItemV2 = {
  internal_id: number;
  item_id: number | null;
  name: string;
  description: string;
  image: { url: string; id: string; hash?: string };
  category: string | null;
  rarity: number | null;
  weight: number | null;
  type: 'np' | 'nc' | 'pb';
  flags: ItemFlags[];
  estVal: number | null;
  status: string | null;
  colorHex: string | null;
  price: ItemPriceField; // acquisition price: np | ncMall | null
  ncValue?: NCValue; // NC trade value (caps); present only for NC items with a known value
  saleStatus: ItemSaleStatusV2 | null;
  slug: string | null;
  comment: string | null;
  canonical_id: number | null;
  firstSeen: string | null;
  useTypes: UseTypes;
};

// price = acquisition cost; ncValue = secondary-market trade value. They coexist
// (mirrors the item page, which shows NC Mall price and the owls/itemdb caps value
// side by side). `ItemPriceField = ItemPriceV2 | (ItemMallData & { type: 'ncMall' }) | null`.
```

### Diff vs `ItemData`

| v1 | v2 |
|----|-----|
| `image` + `image_id` + `cacheHash` | `image: { url, id, hash? }` |
| `isWearable`, `isNeohome`, `isBD`, `isMissingInfo`, `flags` (CSV) | `flags: ItemFlags[]` |
| `isNC` | `type === 'nc'` |
| `color` (lab/rgb/hsv/hex/…) | `colorHex` |
| `price` + `mallData` | discriminated `price` (np \| ncMall) |
| `ncValue` | `ncValue?` (separate optional field, NC only) |
| `inflated: boolean` | `price.flags` |
| `saleStatus` (`sold`/`total`/`percent`/`type`/…) | slim `{ status, addedAt }` on `pricer` / `full` |

### Outside the core envelope (locked)

| Concern | Where it lives |
|---------|----------------|
| RGB / LAB / HSV | Prefer hex in CSS (`colorHex` / 8-digit alpha). RGB helpers only if a caller truly needs them |
| `findAt` | **Client** (`getItemFindAtLinks` adapted for `ItemV2`) |
| Full sale stats (`sold`/`percent`/…) | `/api/v1/items/[id]/saleStats` — ItemV2 only embeds the slim badge |

### `price` + `ncValue` mapping rules (mapper)

`price` (acquisition) and `ncValue` (NC trade value) are independent fields, mapped separately:

`price`:
1. `status === 'no trade'` → `null`
2. NC + active mall → `{ ...mall, type: 'ncMall' }`
3. NC without an active mall → `null` (NC items have no NP acquisition price)
4. NP with a price → `ItemPriceV2`
5. NP unknown/stale → `value: 0`, `flags` includes `'unknown'`
6. NP older than 6 months → `flags` includes `'outdated'` (same rule as `ItemCardBadge`)
7. `pb` → `null`

`ncValue` (via `mapItemV2NcValue`, independent of the mall price):
1. Only for NC items that are not `no trade`; otherwise the field is **omitted**.
2. Source per `NC_VALUES_TYPE` (`lebron` / `itemdb` / `best`); `best` = owls first, else itemdb.
3. No known value → **omitted** (`undefined`, so JSON drops the key).

### `ItemData` deprecated

```ts
/**
 * @deprecated Use `ItemV2` for new code. Kept for `/api/v1` and unmigrated call sites.
 * @see ItemV2
 */
export type ItemData = { /* … */ };
```

Actual removal only after hot-path migration — not in this wave.

---

## Intents

| Intent | Contents |
|--------|----------|
| `minimal` | ids, name, slug, image, type, flags, description, status |
| `card` | + colorHex, price, **ncValue**, rarity, category, estVal |
| `pricer` | ids, image, name, slug, type, status, rarity, price, **ncValue**, **saleStatus** |
| `full` | every `ItemV2` field (resolved from the query-engine field registry — not hand-listed) |

Single registry: `itemIntents` in [`types/itemV2.ts`](../types/itemV2.ts) drives `ItemIntent`, `ItemV2For<>`, field lists, HTTP validation (`parseItemIntent`), and cache TTL (`ttlSeconds` / `getIntentTtl`).  
**JOINs** are decided by the query engine from the fields each intent needs — not declared in the types registry.

`saleStatus` is slim (`{ status: 'ets' \| 'regular' \| 'hts', addedAt }`) — JOIN on latest `SaleStats` (excludes `unknown`). Read-only; no refresh side-effects. Full sold/percent details stay on `/saleStats`. There is **no** `+sales` intent.

No HTTP intent for `findAt` — always client-side.

---

## Target architecture

### Folder layout

```
types/
  types.d.ts                 # ROOT types.d.ts MOVED INTACT (do not refactor the legacy blob)
  itemV2.ts                  # ItemV2 contract, intents (fields + ttlSeconds), ItemV2For
  index.ts                   # @types alias entry: re-export legacy + itemV2

app/server/items/v2.ts       # query engine + mapItemV2 + getManyItemsV2 + getItemV2
app/server/items/itemV2Cache.ts  # Redis/CDN cache-aside for HTTP v2 item routes
app/server/items/itemV2Price.ts  # isolated price-union mapping
app/server/items/itemV2Raw.ts    # raw SQL normalization helpers
app/server/items/getItemForPage.ts  # App Router item-page loader (legacy ItemData)

app/api/v2/
  items/many/route.ts
  items/[id_name]/route.ts
  items/parse.ts             # many-query parsing (intent via parseItemIntent/@types)

utils/item/v2.ts             # client runtime helpers: hasFlag, itemColorRgb, findAt
```

```mermaid
flowchart TD
  Client["Client ?intent=card"]
  Route["app/api/v2/.../route.ts"]
  Types["types/itemV2.ts"]
  Server["app/server/items/v2.ts"]
  Out["ItemV2"]

  Client --> Route
  Route --> Types
  Route --> Server
  Server --> DB[(MariaDB)]
  Server --> Out
  Types --> Server
```

### Phase 0 — types ✅

**1. Move `types.d.ts` → `/types` without changing the rest of the file**

- Moved as-is to `types/types.d.ts` (demo `ItemV2` draft removed — contract lives in `itemV2.ts`).
- `ItemData` marked `@deprecated`.
- Updated `tsconfig.json`: `"@types"` → `./types/index.ts`; `include` / `typeRoots` for the new path.
- Call sites `from '@types'` stay the same.

**2. Create ItemV2 TypeScript helpers under `/types`**

- `types/itemV2.ts`: contract (`ItemV2`, `ItemPriceField`, …), `itemIntents` (fields + `ttlSeconds`), `ItemIntent`, `ItemV2For<>` — TypeScript only (no Prisma/HTTP). JOINs belong to the query engine.
- `types/index.ts` re-exports legacy + `itemV2`.

**3. Rename App Router loader**

- `getItemV2` → `getItemForPage` (`app/server/items/getItemForPage.ts`) — still returns legacy `ItemData`; avoids clash with the future public ItemV2 stack.

**Not in this types step:** SQL query, runtime mapper, Route Handlers, UI.

### HTTP on the App Router

- `app/api/v2/...` Route Handlers; v1 stays under `pages/api/v1/`.
- Covered by `/api/:path*` in [`proxy.ts`](../proxy.ts).

### Suggested imports

```ts
import type { ItemV2, ItemFlags, ItemData } from '@types'; // ItemData deprecated
import { itemIntents, type ItemIntent } from '@types';

import { getManyItemsV2 } from '@app/server/items/v2';
import { getItemForPage } from '@app/server/items';
import { getItemFindAtLinksV2 } from '@utils/item/v2';
```

---

## Migration phases

### Phase 0 — `/types` + ItemV2 TS helpers ✅

**Goal:** Legacy under `/types` (intact move); ItemV2 registry/helpers under `/types`; `ItemData` deprecated; `@types` alias OK; loader renamed.

**Done when:** typecheck green; `from '@types'` unchanged; `types/itemV2.ts` exists; no new API/UI yet.

---

### Phase 1 — Server v2 (query + mapper) ✅

**Goal:** ItemV2 DAL under `app/server/items/`, with orchestration in `v2.ts` and focused raw/price helpers (consumes registry from `@types` / `types/itemV2.ts`).

**Done when:** tests for price union / flags / `minimal` intent; v1 untouched.

---

### Phase 2 — App Router HTTP POC ✅

**Goal:** `app/api/v2/items/many` and `[id_name]`.

**Done when:** responses are `ItemV2`; benchmark recorded; v1 identical.

#### HTTP surface

| Route | Methods | Default intent | Notes |
|-------|---------|----------------|-------|
| `/api/v2/items/many` | `GET`, `POST` | `minimal` | Lookup `{ type, data }` only (`type`: `id` \| `item_id` \| `name_image_id` \| `image_id` \| `name` \| `slug`) + `intent`. Example GET: `?type=id&data[]=1&data[]=2`. |
| `/api/v2/items/[id_name]` | `GET` | `minimal` | Lookup by `internal_id`, `slug`, or `name`; `404` when missing. No PATCH/DELETE (stay on v1) |

Query/body: `?intent=` any key of `itemIntents` (`minimal` \| `card` \| `full` \| `pricer`). Rate limiting remains in `proxy.ts` (`/api/:path*`).

#### Benchmark (2026-07-14)

50 random items × 5 runs via `yarn tsx -r dotenv/config scripts/bench-item-v2.ts`:

| Loader | avg ms | JOINs | Approx JSON bytes / item |
|--------|--------|-------|---------------------------|
| v1 `getManyItems` | 404.5 | 6 fixed | ~1244 |
| v2 `card` | 405.3 | color + price JOINs | ~380 |
| v2 `minimal` | 274.9 | none | — |

Takeaway: `minimal` is clearly cheaper; `card` payload is ~3× smaller than v1 even when wall time is similar on this machine (warm cache / remote RTT can dominate JOINs).

---

### Phase 3 — Cache (CDN + Redis)

**Goal:** Cache the two public HTTP routes (`items/many`, `items/[id_name]`) at two layers — CDN (Cloudflare) and Redis — before adding any new public surface (Search v2). Site/Home is **out of scope** here; it keeps using `'use cache'` only, as today.

**Why before Search v2:** Search v2 will reuse the same `getManyItemsV2` engine and intents; landing the cache primitives (Redis key shape, TTL-per-intent, bypass) first means Search v2 can plug into an already-proven pattern instead of inventing its own.

**Implementation:** [`app/server/items/itemV2Cache.ts`](../app/server/items/itemV2Cache.ts) (`getCachedItemV2` / `getCachedManyItemsV2`).

**Design:**

- Redis key: `iv2:item:{type}:{key}:{intent}` — `type` is the active lookup (`id` / `item_id` / `name` / `slug` / `image_id` / `name_image_id` / `id_name`). The `{key}` segment is always lowercased. One entry per intent; never derived across intents. Writes also set an `id:{internal_id}` alias (same JSON string) so single-item and `many?type=id&data[]=` share entries. HTTP response keys remain DB-canonical (v1 parity).
- **TTL is a single source of truth: `itemIntents[intent].ttlSeconds` in [`types/itemV2.ts`](../types/itemV2.ts)**, read via `getIntentTtl()`. Not duplicated here as a table of numbers — those drift from the code (this doc previously hardcoded stale values). Rule of thumb baked into the registry: intents without `price` (`minimal`) get a longer TTL; intents with `price`/`ncValue` get a shorter one. No tag invalidation (TTL-only).

- Redis stores per-item JSON under **DB-canonical keys** (same indexing as v1 / `getManyItemsV2`). Hits are parsed, merged into a record, and the response is `JSON.stringify`'d once. Redis writes are scheduled with Next.js `after()` so they do not block the response.
- `items/many`: cache-aside **per item** when `keys.length <= ITEM_CACHE_BATCH_MAX` (128) — `mget` the batch, Prisma only for misses, `scheduleItemCacheWrite` for fresh entries. Above the batch max → Prisma only (no Redis read/write).
- CDN: `Cache-Control: public, s-maxage=<TTL>, stale-while-revalidate=<4× TTL>` on `GET` 200 only. `POST /items/many` → `private, no-cache` (Redis-only). Requires a Cloudflare Cache Rule for `/api/v2/items/*` to respect the origin header — outside this repo.
- Bypass: `?fresh=1` skips the Redis read, forces Prisma, returns `Cache-Control: no-store`, still schedules a Redis write, and counts toward quota.
- Quota: `trackItemQuota` on App Router — cache **hits don't consume quota**; only Prisma reads (`dbCount` / single `miss`) increment it.
- Redis must fail fast (short timeout, try/catch, fallback to direct Prisma); same guard pattern as [`utils/api/redis.ts`](../utils/api/redis.ts) (`if (!redis) return`).

**Done when:** ~~both routes serve `Cache-Control` + read/write Redis by intent; quota on miss; `fresh=1` bypass~~ — implemented. Remaining: hit vs miss latency benchmarked in prod; bypass noted in public API reference (Phase 7).

---

### Phase 4 — Search v2 ✅

**Goal:** `app/api/v2/search` (default intent `card`).

**Implementation:** single query, `queryBuilder` untouched. [`app/server/search/searchV2.ts`](../app/server/search/searchV2.ts) reuses `buildSearchQueryParts` (`mode: 'items'` — same filters/sort/pagination as v1) and maps the raw rows with [`app/server/search/searchRowToItemV2.ts`](../app/server/search/searchRowToItemV2.ts), which normalizes the v1 aliases into the `RAW_COLUMNS` shape and delegates to `mapItemV2` (single source for price precedence/flags). Route: [`app/api/v2/search/route.ts`](../app/api/v2/search/route.ts) (`GET`, `s`/`intent`/`page`/`limit`≤3000/filters + `list_id`+JWT), quota via `trackItemQuota(content.length)`, `Cache-Control: private, no-store`. All intents are serviceable (the search row already selects `a.*` + all joins); default `card`.

**`totalResults` is opt-in:** the default skips the `count(*) OVER()` window count; pass `?includeStats=true` to get the real total (otherwise `totalResults` equals the returned page length). No usage/Sentry tracking on the v2 route.

**Parity gap:** the search price-select omits `manual_check` / `priceContext`, so the `unconfirmed` flag and price `context` are absent vs. `/api/v2/items` (add two columns to the price-select if full parity is needed).

**Out of scope (stay on v1):** facets/stats (`onlyStats`, `search/stats`) and `search/omni`; no search cache this phase.

**Done when:** ~~parity on critical filters; smaller payload in the simple case~~ — `test/search-v2.test.ts` asserts v1↔v2 item/order parity + ItemV2 card shape across the critical filter cases.

---

### Phase 5 — UI core

**Goal:** Card/home/lists on `ItemV2`.

**Order:** Image/Badge → CtxMenu/FindAt → ItemCard → home/lists.

**Done when:** hot paths on `ItemV2`; visual parity.

---

### Phase 6 — Broad adoption

**Goal:** Remaining call sites; reduce `ItemData`.

---

### Phase 7 — Public docs and stabilization

**Goal:** v1→v2 changelog; stabilize this document and API reference.

---

## UI checklist (Phase 5+)

| Component / helper | Contract |
|--------------------|----------|
| `ItemImage` / `ItemImageV2` | `image`, `description` |
| `ItemCardBadge` / `ItemCardBadgeV2` | `price` union, `type`, `status`, `flags` |
| `ItemCtxMenu` / `ItemCtxMenuV2` | core + **client** findAt (`getItemFindAtLinksV2`) |
| `getRestockProfit` / `getRestockProfitV2` | np price + category/rarity/estVal |
| `ItemCard` / `ItemCardV2` | intent `card` (`components/Items/v2/ItemCardV2.tsx`, client component — `onSelect`/`onListAction` are plain client callbacks, not Server Actions, so it can't be a real Server Component) |
| `FindAtCard` | core + client findAt + colorHex→rgb |
| Item page | `full` (includes slim `saleStatus`; full stats via `/saleStats` if needed) |
| Search / Home | `card` |
| Widget | `minimal` |

---

## Risks

- Types move: typecheck before new logic.
- Card ↔ CtxMenu: client findAt needs the right core fields.
- Search: filters may force JOINs beyond the intent.
- `@deprecated` alone does not fail CI — review discipline + Phase 5+.
- Cache (Phase 3): CDN hits skip `proxy.ts` entirely (no ban/quota check) — accepted trade-off, not a bug. Redis TTL-only means no explicit invalidation path; a stale value can live up to its TTL after a mutation.

## Out of scope

- Refactoring/splitting the **contents** of `types.d.ts` during the move (relocation only)
- GraphQL; free-form field masks; breaking v1 writes
- Renaming `internal_id` → `id`
- Embedding findAt/RGB in the HTTP envelope
- Removing `ItemData` (deprecate only)
- Tag-based cache invalidation for Phase 3 (TTL-only by design); Next.js Data Cache / custom Redis `cacheHandler` for the App Router (evaluated, deferred — see cache strategy discussion)

## Next steps

1. ~~**Phase 0:** move `types.d.ts` → `/types` + `types/itemV2.ts` + tsconfig + rename loader.~~
2. ~~**Phase 1:** `app/server/items/v2.ts` (query + mapper).~~
3. ~~**Phase 2:** `app/api/v2/items/many` + `[id_name]` Route Handlers + benchmark vs v1.~~
4. ~~**Phase 3:** CDN + Redis cache (per-intent TTL, bypass param, quota-on-miss).~~
5. ~~**Phase 4:** `app/api/v2/search` (default intent `card`).~~
6. **Phase 5:** migrate hot-path UI (item page, search results, lists, restock) to `ItemCardV2` / `ItemV2`.
