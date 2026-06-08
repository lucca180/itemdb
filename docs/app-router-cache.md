# App Router — cache map by page

Reference for `'use cache'` functions (persistent Data Cache) and per-request caches (`React.cache`), organized by App Router route.

Global config: `cacheComponents: true` in [`next.config.ts`](../next.config.ts). Tags and scopes in [`utils/appCacheTags.ts`](../utils/appCacheTags.ts). Tag helper in [`utils/applyItemCacheTags.ts`](../utils/applyItemCacheTags.ts).

## `cacheLife` presets

| Preset | stale | revalidate | expire | Typical use |
|--------|------:|-----------:|-------:|-------------|
| `itemFast` | 60s | 60s | 300s | NP prices, last seen, official/trade lists |
| `itemSection` | 300s | 300s | 3600s | Item cards (dye, trade, avy) |
| `itemMedium` | 600s | 600s | 3600s | Parent, MME, recipes, similar |
| `homeSection` | 180s | 300s | 3600s | Home sections (prices, latest items) |
| `homeFast` | 180s | 180s | 3600s | Articles, NC insights, Lebron |
| `homeSlow` | 3600s | 3600s | 86400s | Trending, effects, petpet |
| inline `{ stale: 600, … }` | 600s | 600s | 3600s | NC Mall latest/leaving (home) |

Every item `'use cache'` entry carries **two tags**: `item-{id}` (root) + `item-{id}-{scope}` via `applyItemSectionCacheTags`.

---

## Home — `app/[locale]/page.tsx`

Route: [`app/[locale]/page.tsx`](../app/[locale]/page.tsx)

### `LatestPricesSection`

| Function | File | Tag | cacheLife | Components |
|----------|------|-----|-----------|------------|
| `getLatestPrices` | [`LatestPricesSection.tsx`](../app/_components/Home/Sections/LatestPricesSection.tsx) | `home-latest-prices` | `homeSection` | `LatestPricesSection` → `LatestPricesSectionContent` |

**Used on:** top of the home page, directly below the hero.

---

### `EventCard`

| Function | File | Tag | cacheLife | Components |
|----------|------|-----|-----------|------------|
| `getCachedEventLists(category, limit)` | [`EventCard.tsx`](../app/_components/Home/Cards/EventCard.tsx) | `home-event-card-lists` | `homeSlow` | `TVWHomeCard` → `TVWHomeCardContent` |

**Used on:** The Void Within event card on the home page.

**Note:** `category` and `limit` arguments are part of the cache key.

---

### `NewItemsCountSection`

| Function | File | Tag | cacheLife | Components |
|----------|------|-----|-----------|------------|
| `getCachedNewItemsCount` | [`NewItemsCountSection.tsx`](../app/_components/Home/Cards/NewItemsCountSection.tsx) | `home-new-item-count` | `homeSection` | `NewItemsCountSection` → `NewItemsCountSectionContent` |

---

### `HomeServerCards`

| Function | File | Tag | cacheLife | Exported component |
|----------|------|-----|-----------|-------------------|
| `getCachedLatestItems` | [`HomeServerCards.tsx`](../app/_components/Home/Cards/HomeServerCards.tsx) | `home-latest-items` | `homeSection` | `LatestItemsHomeCard` |
| `getCachedTrendingItems` | same | `home-trending-items` | `homeSlow` | `TrendingItemsHomeCard` |
| `getCachedFeaturedLists` | same | `home-trending-lists` | `homeSlow` | `FeaturedListsHomeCard` |
| `getCachedLatestNcMallItems` | same | `home-latest-nc-mall` | inline 600s | `LatestNcMallHomeCard` |
| `getCachedLeavingNcMallItems` | same | `home-latest-nc-mall` | inline 600s | `LeavingNcMallHomeCard` |
| `getCachedLatestWearableItems` | same | `home-latest-wearable-items` | `homeSection` | `LatestWearableHomeCard` |

**Used on:** home card grid and rows (see composition in `HomePageContent`).

---

### `LatestArticlesSection`

| Function | File | Tag | cacheLife | Components |
|----------|------|-----|-----------|------------|
| `getCachedLatestArticles(limit)` | [`LatestArticlesSection.tsx`](../app/_components/Home/Sections/LatestArticlesSection.tsx) | `home-latest-articles` | `homeFast` | `LatestArticlesSection` → `LatestArticlesSectionContent` → [`LatestArticleCard`](../app/_components/Home/Sections/LatestArticleCard.tsx) |

**Note:** `isNew` (recent-article badge) is computed **inside** the cache, together with the posts.

---

### No `'use cache'` on home

| Component | Cache |
|-----------|-------|
| `StatsCard` | No Data Cache documented here (direct fetch / Suspense) |
| `HomeHero` | Static (page props) |

---

## Item — `app/[locale]/item/[slug]/page.tsx`

Route: [`app/[locale]/item/[slug]/page.tsx`](../app/[locale]/item/[slug]/page.tsx)  
Orchestrator: [`ItemPage.tsx`](../app/_components/Item/page/ItemPage.tsx)  
Initial data: [`loadItemPage.ts`](../app/utils/loadItemPage.ts)

### Page shell (blocking preload)

Loaded in `fetchItemPageData` before the main render:

| Exported function | Internal cache | Tags (scope) | cacheLife | Consumed by |
|-------------------|----------------|--------------|-----------|-------------|
| `loadNPPrices` | `loadNPPricesCached` | `np-prices` | `itemFast` | `ItemPage` → `ItemPriceSection` (NP items) |
| `loadNCTradeInsights` | `loadNCTradeInsightsCached` | `nc-insights` | `homeFast` | `ItemPage` → `NCTradeSection` (NC items) |
| `loadNCMallData` | `loadNCMallDataCached` | `nc-mall` | `itemSection` | `ItemPage` → `NcMallCard` (NC items) |

`getItemNCMall` (Pages API) remains uncached — App Router uses `loadNCMallData` above.

---

### `loadUtils.ts` — shared loaders

File: [`app/_components/Item/loadUtils.ts`](../app/_components/Item/loadUtils.ts)

| Exported function | Internal cache | Tags (scope) | cacheLife | Components / usage |
|-------------------|----------------|--------------|-----------|-------------------|
| `getOfficialItemLists` | `getOfficialItemListsCached` | `lists` | `itemFast` | `ItemAvyCard` (`loadAvyData`); indirectly via `loadItemPageLists` |
| `loadItemPageLists` | *(React.cache)* → `getOfficialItemLists` | `lists` | `itemFast` | `ItemHeader`, `ItemOfficialListsSection`, `ItemPriceSection`, `RelatedLinksCard` |
| `loadItemEffects` | `loadItemEffectsCached` | `effects` | `homeSlow` | `ItemEffectsSection`, `ItemPageWearablePreview`, `ItemPageEditSectionLoader`, `RelatedLinksCard` |
| `loadItemColors` | `loadItemColorsCached` | `colors` | `homeSlow` | `ColorInfoSection` |
| `loadItemWearableData` | `loadItemWearableDataCached` | `wearable` | `homeSlow` | `ItemPageWearablePreview` |
| `loadLastSeen` | `loadLastSeenCached` | `last-seen` | `itemFast` | `ItemPriceSection` (`LastSeenStats`), `ItemRestockInfo` |
| `loadTradeLists` | `loadTradeListsCached` | `trade-lists` | `itemFast` | `ItemPriceSection` (trading/seeking tabs), `NCTradeSection` |
| `loadPetpetData` | `loadPetpetDataCached` | `petpet` | `homeSlow` | `PetpetCard`, `RelatedLinksCard` |
| `loadLebronTradeHistory` | `loadLebronTradeHistoryCached` | `lebron` | `homeFast` | `NCTradeSection` |

#### Special behavior

- **`loadTradeLists`:** `shouldShowTradeLists(item)` runs **outside** `'use cache'` (time-based gate per request). Only `getItemLists` is persisted in the Data Cache.
- **`loadItemEffects`:** takes `itemSnapshot` as a cache argument; uses `fresh ?? itemSnapshot` if `getCachedItem` fails.
- **`getCachedItem` / `loadPriceStatus`:** `React.cache` only (per request) — **not** `'use cache'`. `loadPriceStatus` is user-specific and loads inside Suspense in `ItemPriceSection`.

---

### Cards with their own loader

Each card below defines its `'use cache'` function in the same file.

| Internal function | File | Tags (scopes) | cacheLife | Component |
|-------------------|------|---------------|-----------|-----------|
| `loadAvyData` | [`ItemAvyCard.tsx`](../app/_components/Item/Avy/ItemAvyCard.tsx) | `avy`, `lists` | `itemSection` | `ItemAvyCard` |
| `loadMMEData` | [`MMECard.tsx`](../app/_components/Item/MME/MMECard.tsx) | `mme` | `itemMedium` | `MMECard` |
| `loadDyeData` | [`DyeCard.tsx`](../app/_components/Item/Dye/DyeCard.tsx) | `dye` | `itemSection` | `DyeCard` |
| `loadItemRecipes` | [`ItemRecipesCard.tsx`](../app/_components/Item/Recipes/ItemRecipesCard.tsx) | `recipes` | `itemMedium` | `ItemRecipesCard` |
| `loadItemParentData` | [`ItemParent.tsx`](../app/_components/Item/ItemParent/ItemParent.tsx) | `parent` | `itemMedium` | `ItemParent` |
| `loadSimilarItemDataCached` | [`loadSimilarItems.ts`](../app/_components/Item/SimilarItems/loadSimilarItems.ts) | `similar` | `itemMedium` | `SimilarItemsCard` |
| `loadItemTrades` | [`TradeCardSection.tsx`](../app/_components/Item/Trade/TradeCardSection.tsx) | `trade` | `itemSection` | `TradeCardSection` |

**avy ↔ lists note:** `loadAvyData` tags `lists` in addition to `avy`, so avatars are invalidated when official lists change.

---

### Drops

File: [`loadItemDrops.ts`](../app/_components/Item/Drops/loadItemDrops.ts)

| Exported function | Internal cache | Tags (scope) | cacheLife | Components |
|-------------------|----------------|--------------|-----------|------------|
| `loadItemOpenableMeta` | `loadItemOpenableMetaCached` | `drops` | `itemFast` | `ItemDropsSection`, `ItemPageOutfitSectionLoader` |
| `loadDropItemCardData` | `loadDropItemCardDataCached` | `drop-items` | `itemFast` | `ItemDrops` (child of `ItemDropsSection`) |
| `loadItemDropsCardData` | composes both above | — | — | *(helper; not directly referenced in current UI)* |

**Drop cache keys:** `internalId`, `isNC` (openable); `parentInternalId` + sorted `dropInternalIds[]` (drop items).

---

### Visual map — `ItemPage`

```
ItemPage
├── ItemPriceSection          → loadNPPrices*, loadItemPageLists*, loadLastSeen*, loadTradeLists*
├── NCTradeSection            → loadNCTradeInsights*, loadLebronTradeHistory, loadTradeLists
├── ItemEffectsSection        → loadItemEffects
├── ItemOfficialListsSection  → loadItemPageLists
├── ItemHeader                → loadItemPageLists
├── ColorInfoSection          → loadItemColors
├── ItemPageWearablePreview   → loadItemEffects, loadItemWearableData
├── ItemPageEditSectionLoader → loadItemEffects
├── MMECard                   → loadMMEData (internal)
├── DyeCard                   → loadDyeData (internal)
├── PetpetCard                → loadPetpetData
├── ItemRecipesCard           → loadItemRecipes (internal)
├── ItemDropsSection          → loadItemOpenableMeta → ItemDrops → loadDropItemCardData
├── SimilarItemsCard          → loadSimilarItemData
├── ItemAvyCard               → loadAvyData (internal)
├── ItemParent                → loadItemParentData (internal)
├── TradeCardSection          → loadItemTrades (internal)
├── ItemRestockInfo           → loadLastSeen
└── RelatedLinksCard          → loadItemEffects, loadItemPageLists, loadPetpetData

* preloaded in shell (loadItemPage) or shared with shell
```

---

## Invalidation

### Home tags → APIs

| Tag | Triggered by (examples) |
|-----|-------------------------|
| `home-latest-items`, `home-latest-wearable-items`, `home-new-item-count`, `home-trending-items` | [`pages/api/v1/items/process.ts`](../pages/api/v1/items/process.ts) |
| `home-latest-nc-mall` | [`pages/api/v1/mall/sync.ts`](../pages/api/v1/mall/sync.ts) |

Home tags with no documented automatic invalidation: `home-latest-articles`, `home-latest-prices`, `home-event-card-lists`, `home-trending-lists` — rely on TTL.

### Item tags → APIs

| `ItemRevalidateTags` preset | Scopes | Triggered by (examples) |
|-----------------------------|--------|-------------------------|
| `root` | all entries tagged `item-{id}` | Item PATCH/DELETE |
| `effects` | `effects`, `wearable` | [`effects.ts`](../pages/api/v1/items/[id_name]/effects.ts) |
| `drops` | `drops`, `drop-items` | [`drops.ts`](../pages/api/v1/items/[id_name]/drops.ts) |
| `petpet` | `petpet` | [`petpet.ts`](../pages/api/v1/items/[id_name]/petpet.ts) |
| `colors` | `colors` | preview color cache |
| `preview` | `wearable`, `avy` | preview outfit/image cache |

Lists (`lists`, `trade-lists`): **no invalidation in list APIs** — freshness via `itemFast` (60s). Admins can force refresh (below).

### Manual refresh (admin)

- UI: **Refresh cache** button in [`ItemPageAuthGates.tsx`](../app/_components/Item/page/ItemPageAuthGates.tsx)
- Endpoint: `POST /api/internal/revalidate` with tag `item-{internalId}` (auth: admin session or Bearer secret)
- Invalidates all sections that carry the root tag

---

## Per-request caches (`React.cache`)

Do not persist across requests; dedupe within the same render tree.

| Function | File | Usage |
|----------|------|-------|
| `getCachedItem` | `loadUtils.ts` | Slug resolution, internal card loaders |
| `loadItemPageLists` | `loadUtils.ts` | Wrapper over `getOfficialItemLists` |
| `loadNPPrices` | `loadUtils.ts` | Wrapper over `loadNPPricesCached` |
| `loadNCMallData` | `loadUtils.ts` | Wrapper over `loadNCMallDataCached` |
| `loadPriceStatus` | `loadUtils.ts` | `ItemPriceSection` (user-specific) |
| `loadTradeLists` | `loadUtils.ts` | Wrapper with temporal gate |
| `resolveItemPage` / `getItemPageData` | `loadItemPage.ts` | Item route resolution |

---

## Maintenance

When adding a `'use cache'` loader:

1. Pick a preset in `next.config.ts` or use inline `cacheLife({ … })`.
2. Call `applyItemSectionCacheTags(internalId, 'scope')` (or multiple scopes).
3. Register the scope in `ITEM_PAGE_CACHE_SCOPES` / `HOME_CACHE_TAGS` in `appCacheTags.ts`.
4. Update this document and, if applicable, `ItemRevalidateTags` or `revalidateItem` calls in the mutation API.
