# Chakra UI v3 Migration Plan

This doc is the project-specific plan for migrating itemdb from Chakra UI v2 to Chakra UI v3.

The migration should be treated as a staged frontend infrastructure project, not as a single package upgrade. Chakra v3 changes the provider API, theme system, color mode setup, icons, many prop names, and several components now use compound component APIs.

## Progress snapshot

Last updated: 2026-05-22

### At a glance

| Metric | Value |
|--------|-------|
| `yarn typecheck` errors | **0** (branch start ~997; modals + Items + price/contribute clusters) |
| Phases 0–3 | Largely done (provider, theme, toast, icons) |
| Phase 4–7 | Largely done — remaining work is browser QA |
| Next focus | Route QA (Phase 9), `yarn lint` cleanup |

### Completed clusters (pass targeted `yarn typecheck` filters)

- [x] Provider / theme (`utils/theme.ts`, `_app.tsx`, `app/providers.tsx`, `_document.tsx`)
- [x] Restock pages + hub components + restock modals
- [x] `components/Card/*`, `Breadcrumbs`, `Wrapped2024`, `ImportInfo`
- [x] `components/Input/*` (13 files; `@choc-ui/chakra-autocomplete@^6.2.2` v3-compatible)
- [x] `components/Feedback/*` (first batch), `SearchFilters`, price modals (`CreatePriceModal`, `AdminEditPriceModal`, `WrongPriceModal`)
- [x] App Router cleanup (`privacy`, `terms`, `LayoutLocaleSelect`, `HomeCard`)
- [x] `pages/lists/import/*`
- [x] **`components/UserLists/*`** — entire folder (e.g. `ListSelect`, `AddToListSelect`, `EditableFields`, `ListCard`, `ListHeader`, `ListViewport`, `EditableItemCard`, `ItemList`)
- [x] **`components/Modal/*`** — entire folder (30 files)
- [x] **`components/Items/*`** — entire folder (19 files) + `VirtualizedItemList.tsx`

### Session log

#### Latest — Phase 8: autocomplete v3 API (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Input selects | 6 `*Select.tsx` files | `@choc-ui/chakra-autocomplete@^6.2.2` (Chakra v3 peers); `variant="filled"` → `variant="subtle"`; `loading` → `isLoading` on `AutoComplete`. |
| Lint cleanup | `ConfirmDeleteItem`, `ExportListModal`, `LastSeenModal`, `contribute.tsx` | Removed unused imports from migration. |

**Impact:** Phase 8 complete. `yarn typecheck` passes. Scoped `yarn lint components pages app utils` — 0 errors, 3 warnings.

#### Previous — Typecheck green: hubs, tools, utils recipes (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Tools / hubs | `rainbow-pool`, `api`, `troubleshooting`, `data-collecting`, hub pages | `NativeSelect`, `Tooltip.Root`, `Alert.Root`, `Field`, `fontSize`, `variant="subtle"`. |
| Layout / search / trades | `HeaderDropdown`, `SearchBar`, `SearchLists`, `TradeTable`, `official/*`, `lists/*` | `Popover.Root`, `InputGroup` `startElement`/`endElement`, `Menu`/`Link asChild`, `Switch.Root`. |
| Utils | `HeadingLine`, `Image`, `Tooltip`, `OldPoolDrops`, `SkeletonImage`, `SiteAlert`, `ItemCtxMenu` | `chakra()` `base` (not `baseStyle`), `Tooltip` compound, accordion compound. |

**Impact:** ~106 → **0** errors (−106). `yarn typecheck` passes.

#### Previous — Feedback pages, PriceTable, Layout, menus (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Pages | `feedback/vote.tsx`, `feedback/trades.tsx`, `faq.tsx`, `public-data.tsx` | `Accordion.Root`, `Alert.Root`, `List.Root` + `List.Indicator`, `Table.*`, `useDisclosure` → `open`, `fontSize` on `Text`, `target="_blank"`, button children instead of `leftIcon`. |
| Price | `PriceTable.tsx` | `Table.Root` + `Table.ScrollArea`, `Link asChild` + `MainLink`, `IconButton` children. |
| Layout / menus | `Layout.tsx`, `SearchMenu.tsx` | `NativeSelect`, `ChakraLink asChild` + Next `Link`, `Menu.Root` compound. |
| NCTrades | `NCTradeHistory.tsx` | `Card.Root`, `List.Root`, `StackSeparator`, `Button asChild` + `NextLink`. |

**Impact:** ~172 → **~106** errors (−66).

#### Previous — ContributeWall, item page, MatchTable, articles (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Utils | `ContributeWall.tsx` | `Accordion.Root` compound, external links. |
| NCTrades | `MatchTable.tsx` | `Table.Root` + `Table.ScrollArea`. |
| Pages | `item/[id].tsx` | `Badge asChild` + `NextLink` for category/type badges. |
| Pages | `articles/[slug].tsx` | `List.Root`, `Table.*`, `Alert.Root`, `fontSize` on `Text`. |

**Impact:** ~212 → **~172** errors (−40).

#### Previous — SeenHistory + SearchModal (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| SeenHistory | `AuctionHistory`, `RestockHistory`, `TradeHistory`, `SeenHistoryModal`, `SeenHistoryStatusCard` | `Table.Root` + `Table.ScrollArea`, `Tabs.Root`, `Dialog`, `SkeletonText` `noOfLines`. |
| Search | `SearchModal.tsx` | `Dialog`, `InputGroup` `startElement`/`endElement`, `variant="subtle"`, `Link asChild` for search query row. |

**Impact:** ~259 → **~212** errors (−47).

#### Previous — mall/report, list detail, NCTrades (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Pages | `mall/report.tsx` | `Steps.Root` (replaces `Stepper`/`useSteps`), `Field.*`, `variant="subtle"`, external links. |
| Pages | `lists/[username]/[list_id].tsx` | `useDisclosure` → `open`, `Switch.Root`, `Field.*`, `IconButton` children, `isLoading` props. |
| NCTrades | `index.tsx` | `Stat.Root`, `ButtonGroup` `attached`/`data-active`, `Link asChild`, `isLoading` on `MatchTable`. |

**Impact:** ~312 → **~259** errors (−53).

#### Previous — Pages + Price + Layout menus (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Pages | `contribute.tsx` | `Tabs.Root`, `List.Root` + `List.Indicator`, `Alert.Root`, external links. |
| Price | `ItemPriceCard.tsx` | `Stat.Root`, `Alert.Root`, `ButtonGroup` `attached`/`data-active`, `useDisclosure` → `open`. |
| Layout / menus | `AuthButton.tsx`, `ItemCtxMenu.tsx` | `Menu.Root`, `chakra()` `base` (not `baseStyle`), `Tooltip.Root`. |

**Impact:** ~401 → **~312** errors (−89).

#### Previous — Items cluster complete (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| All `components/Items/*` | 19 files | `Tag.Root`, `Tooltip.Root`, `Menu.Root`, `Alert.Root`, `List.Root`, `Accordion.Root`, `Link asChild`, `IconButton` children, `useDisclosure` → `open`, external links via `target="_blank"`. |
| Quick win | `VirtualizedItemList.tsx` | `useSize` → local `ResizeObserver` hook (same as `ListViewport`). |
| Shared | `IconLink.tsx` | Maps `isExternal` → `target` / `rel`. |

**Impact:** ~534 → **~401** errors (−133). `components/Items/*` has **0** typecheck errors.

#### Previous — Modals cluster complete (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| All `components/Modal/*` | 30 files | `Modal`/`AlertDialog` → `Dialog`; `Field`, `NativeSelect`, `Accordion`, `Table`, `Alert`, `Switch` compounds; `Link asChild`; `useDisclosure` → `open`. |
| Prior batch | `EditItemModal`, `CreateListModal`, `DuplicatedItemModal` | Largest forms + tabs. |

**Impact:** ~882 → **~534** errors (−348). `components/Modal/*` has **0** typecheck errors.

#### Previous — UserLists cluster (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Forms | `EditableFields.tsx` | `NumberInput.Root` compound, `Checkbox.Root` compound, label+input via `Flex` (replaces `InputLeftAddon` / v2 `NumberInput` children). |
| Cards / header | `ListCard.tsx`, `ListHeader.tsx` | `Link asChild` + `NextLink`, `Badge asChild`, `IconButton` children, `Tooltip` compound, `useDisclosure` → `open`, external links via `target="_blank"`. |
| Viewport | `ListViewport.tsx` | Replaced removed Chakra `useSize` with local `ResizeObserver` hook. |

**Impact:** ~939 → **882** errors (−57).

#### Previous — list/import + input final (2026-05-22)

| Area | Files | Changes |
|------|-------|---------|
| Shared input | `ItemSelect.tsx`, `SpeciesSelect.tsx`, `NeoColorSelect.tsx` | Fixed `implicit any`; all `components/Input/*` clean in typecheck. |
| List import | `pages/lists/import/index.tsx`, `advanced.tsx` | `Field`, `NativeSelect`, `Checkbox` compound, `Link asChild`, native `<form>`. |
| UserLists menus | `ListSelect.tsx`, `AddToListSelect.tsx` | `Menu.Root` compound, `Tooltip` compound, `open` from `useDisclosure`. |
| App Router | `HomeCard.tsx` | `Separator` from `@chakra-ui/react`. |

**Impact:** ~997 → ~939 errors (−58).

### Current branch state (cumulative)

- Phase 0 is complete and documented in [chakra-v3-phase-0-report.md](./chakra-v3-phase-0-report.md).
- Phase 1 is partially complete:
  - `@chakra-ui/react` upgraded to `^3.35.0`
  - `@chakra-ui/icons` removed from `package.json`
  - `@emotion/styled` removed from `package.json`
  - `yarn.lock` refreshed
- Phase 2 is partially complete:
  - `utils/theme.ts` migrated from `extendTheme` to `createSystem(defaultConfig, ...)`
  - `pages/_app.tsx` and `app/providers.tsx` now use `ChakraProvider value={system}`
  - old cookie-based color mode wiring was removed
  - Pages Router `_document` now forces dark mode through `<Html data-theme="dark">`
- Phase 3 is partially complete:
  - toaster renderer created in `components/ui/toaster.tsx`
  - `useToast` compatibility wrapper created in `utils/toast.ts`
  - icon compatibility map created in `utils/chakraIcons.tsx`
- Phase 4 has started:
  - bulk mechanical renames were started for props such as `colorScheme`, `isDisabled`, `isLoading`, `textColor`, `spacing`, `sx`, and `Divider`
  - these rewrites are not fully reviewed yet and are mixed with still-pending component-family migrations
  - earlier sessions migrated the first real compound/component-family clusters:
    - dynamic-list flows now use `Dialog`, `Field`, `NativeSelect`, and `List.Root`
    - `pages/search.tsx` now uses Chakra v3 `NativeSelect` and v3-style `IconButton`
    - `components/Feedback/FeedbackButton.tsx` and `components/Feedback/FeedbackTrade.tsx` were moved off `isOpen`, `FormControl`, `AlertIcon`, `leftIcon`, and `icon`
    - `pages/tools/api.tsx`, `pages/tools/data-collecting.tsx`, and `pages/tools/price-calculator.tsx` were migrated to `Field`, `NativeSelect`, `Switch.Root`, `loading`, and `target="_blank"` instead of `isExternal`
  - an earlier session completed the full `restock` Pages Router cluster:
    - `pages/restock/dashboard/index.tsx`
    - `pages/restock/dashboard/2024.tsx`
    - `pages/restock/dashboard/2025.tsx`
    - `pages/restock/[id]/index.tsx`
    - `pages/restock/[id]/history.tsx`
    - `pages/restock/index.tsx`
  - the supporting `restock` shared components and modals were migrated as part of that pass:
    - `RestockHeader`, `RestockItemCard`, `StatsCard`, `RestockHistoryCard`
    - `SearchFiltersModal`, `DashboardOptionsModal`, `ImportRestock`, `RestockWrappedModal`
  - this session completed the next shared UI wave after `restock`:
    - `components/Card/*`
    - `components/Breadcrumbs/Breadcrumbs.tsx`
    - `components/Hubs/Wrapped2024/Timeline.tsx`
    - `components/Hubs/Wrapped2024/CTACard.tsx`
    - `components/Import/ImportInfo.tsx`
  - the latest session started the shared input cleanup wave and cleared the first batch:
    - `components/Input/Pagination.tsx`
    - `components/Input/CollapseNumber.tsx`
    - `components/Input/CustomNumber.tsx`
    - `components/Input/MultiplyInput.tsx`
    - `components/Input/NegCheckbox.tsx`
    - `components/Input/SelectItemsCheckbox.tsx`
    - `components/Input/SortSelect.tsx`
  - the latest session also cleared the first remaining feedback files:
    - `components/Feedback/FeedbackItem.tsx`
    - `components/Feedback/NewPolicyReminder.tsx`
    - `components/Feedback/TradeCalculatorModal.tsx`
  - the latest session continued the shared filter/modal wave and cleared:
    - `components/Search/SearchFilters.tsx`
    - `components/Modal/CreatePriceModal.tsx`
    - `components/Modal/AdminEditPriceModal.tsx`
    - `components/Modal/WrongPriceModal.tsx`
  - the latest session also cleared the small follow-up surfaces that were explicitly next in the queue:
    - `components/Hubs/Effects/EffectsCard.tsx`
    - `app/privacy/PrivacyPageClient.tsx`
    - `app/terms/TermsPageClient.tsx`
    - `app/_components/layout/LayoutLocaleSelectClient.tsx`
  - the list/import + input-final wave (see **Latest session** table above) is complete
  - the main migration work across earlier waves included:
    - `Breadcrumb.Root` / `Breadcrumb.List` / `Breadcrumb.Item` / `Breadcrumb.Link` / `Breadcrumb.CurrentLink`
    - `Avatar.Root` / `Avatar.Fallback`
    - `List.Root` / `List.Item`
    - `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`
    - `Button asChild` / `Link asChild`
    - removal of Chakra v2 `isExternal`, `prefetch` on Chakra `Link`, and `Heading as={NextLink}` patterns
  - the main Chakra v3 patterns now established in the codebase are:
    - `Dialog.Root` / `Dialog.Backdrop` / `Dialog.Positioner` / `Dialog.Content`
    - `Alert.Root` / `Alert.Indicator` / `Alert.Content`
    - `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`
    - `Tooltip.Root` / `Tooltip.Trigger` / `Tooltip.Positioner` / `Tooltip.Content`
    - `NativeSelect.Root` / `NativeSelect.Field` / `NativeSelect.Indicator`
    - `Menu.Root` / `Menu.Trigger` / `Menu.Positioner` / `Menu.Content` / `Menu.Item` / `Menu.Separator`
    - `NumberInput.Root` / `NumberInput.Input` / `NumberInput.Control`
    - `Checkbox.Root` / `Checkbox.HiddenInput` / `Checkbox.Control` / `Checkbox.Label`
    - `Tag.Root` / `Tag.Label`
    - v3 `IconButton` children instead of `icon`
    - `Link asChild` or `target="_blank"` / `rel="noreferrer"` instead of `isExternal`

### Current validation state

| Check | Status |
|-------|--------|
| `yarn install --mode=skip-build` | Pass |
| `yarn typecheck` | **Pass — 0 errors** (down from ~997 at start of migration branch; ~836 on codemod spike baseline) |
| Provider / theme layer | No longer the main blocker |
| `components/Input/*` (all 13 files) | Clean in targeted `typecheck` |
| `pages/lists/import/*` | Clean in targeted `typecheck` |
| `components/UserLists/*` (all files) | Clean in targeted `typecheck` |

Clusters already migrated and stable under targeted filters include: `restock` pages + hub components, `components/Card/*`, `Breadcrumbs`, `Wrapped2024`, `ImportInfo`, first input/feedback/filter/modal batches, App Router privacy/terms/locale, list/import wave, and full `UserLists` cluster.

### Remaining blockers (from `yarn typecheck`)

1. **Chakra v2-only components** still used in unmigrated files:
   - `Modal` / `AlertDialog` (largest modal backlog)
   - legacy `Select`, `Tabs`, `Tooltip`, `Switch`, `Checkbox` (as single JSX tags, not compounds)
   - `Card`, `Avatar`, `Breadcrumb`, `List`, `Accordion`, table namespaces
2. **Chakra v2-only props** still scattered:
   - `isExternal`, `icon`, `leftIcon` / `rightIcon`
   - `prefetch` on Chakra `Link`
   - `size` on `Text`
   - `isOpen` from `useDisclosure` (call sites not yet updated)
   - `sx`
3. **`@choc-ui/chakra-autocomplete@^6.2.2`** — updated for Chakra v3; 6 `*Select.tsx` files migrated (`variant="subtle"`, `isLoading`).

### Highest-yield queue (from latest `yarn typecheck`)

Re-run `yarn typecheck` after each cluster. Counts are per-file TS errors.

| Priority | Errors | File / cluster |
|----------|--------|----------------|
| — | done | All `components/Modal/*` (0 TS errors) |
| — | done | All `components/Items/*` (0 TS errors) |
| — | done | `VirtualizedItemList.tsx` |
| — | done | `pages/contribute.tsx` |
| — | done | `pages/mall/report.tsx` |
| — | done | `pages/lists/[username]/[list_id].tsx` |
| 3 | ~100+ | Other pages (`rainbow-pool`, lists, admin, login, hub, …) |
| — | done | `feedback/vote`, `feedback/trades`, `faq`, `public-data` |
| — | done | `components/Price/PriceTable.tsx`, `Layout.tsx`, `Menus/SearchMenu.tsx`, `NCTrades/NCTradeHistory.tsx` |
| — | done | `components/Price/ItemPriceCard.tsx`, `Layout/AuthButton.tsx`, `Menus/ItemCtxMenu.tsx` |
| — | done | `components/NCTrades/index.tsx` |
| 4 | 14 | `components/SeenHistory/AuctionHistory.tsx`, … |
| — | done | `@choc-ui/chakra-autocomplete@^6.2.2` in 6 `components/Input/*Select.tsx` files |

**Reference implementations**

| Pattern | Where to copy from |
|---------|-------------------|
| `Dialog` + `Field` | `ImportRestock`, `CreatePriceModal`, restock modals |
| `Menu` | `ListSelect.tsx`, `SortSelect.tsx` |
| `NumberInput` + `Checkbox` | `EditableFields.tsx`, `CustomNumber.tsx` |
| `Tooltip` + `Tag` | `StatsCard.tsx`, `ListHeader.tsx` |
| `Link` / `Badge` | `ListCard.tsx`, `ImportInfo.tsx` |
| `useSize` replacement | `ListViewport.tsx` (`ResizeObserver`) |

## Next session resume

1. **Browser QA** (Phase 9) — follow [browser-qa-test-plan.md](./browser-qa-test-plan.md); compare each route with itemdb.com.br.
2. Scoped lint cleanup — 3 warnings remain in `CustomNumber.tsx`, `restock/dashboard/index.tsx`.
3. Re-run `yarn typecheck` after any follow-up edits to confirm **0** errors.

### Done — do not re-open unless regressions

| Cluster | Notes |
|---------|-------|
| Provider / theme / toast / icons | Browser QA for color mode still pending (Phase 2) |
| `components/Input/*` | Fully migrated; `@choc-ui/chakra-autocomplete@^6.2.2` v3-compatible |
| `pages/lists/import/*` | Fully migrated |
| `components/UserLists/*` | Fully migrated (2026-05-22) |
| `components/Modal/*` | Fully migrated (2026-05-22) — 0 typecheck errors |
| `components/Items/*` | Fully migrated (2026-05-22) — 0 typecheck errors |
| `VirtualizedItemList.tsx` | `useSize` replaced with `ResizeObserver` |

## Current baseline

Package versions at the time this plan was written:

| Package | Current version |
|---------|-----------------|
| `@chakra-ui/react` | `^3.35.0` |
| `@chakra-ui/icons` | removed |
| `@chakra-ui/panda-preset` | `^3.35.0` |
| `@pandacss/dev` | `^1.11.1` |
| `next` | `16.2.6` |
| `react` | `19.2.6` |

Measured Chakra usage:

| Area | Current surface |
|------|-----------------|
| Files importing Chakra React or Chakra icons | 186 |
| `@chakra-ui/icons` imports | 14 |
| `colorScheme` props | 254 |
| `Modal` / modal subcomponent references | 145 |
| `FormControl` references | 205 |
| `FormLabel` references | 189 |
| `FormHelperText` references | 94 |
| `Divider` references | 57 |
| `Checkbox` references | 45 |
| `Tabs` references | 21 |
| `Menu` references | 18 |
| `NumberInput` references | 16 |
| `Accordion` references | 29 |

Important local files:

| File | Role |
|------|------|
| `utils/theme.ts` | Chakra v2 `extendTheme` setup |
| `pages/_app.tsx` | Pages Router Chakra provider |
| `app/providers.tsx` | App Router Chakra provider and color mode manager |
| `pages/_document.tsx` | Pages Router document setup |
| `components/Input/*Select.tsx` | `@choc-ui/chakra-autocomplete` usage |

## Official docs

Use these docs before implementing each phase:

- Chakra migration guide: `https://chakra-ui.com/docs/get-started/migration`
- Chakra v3 LLM migration docs: `https://chakra-ui.com/llms-v3-migration.txt`
- Chakra v3 theming overview: `https://chakra-ui.com/docs/theming/overview`
- Chakra v3 components docs: `https://chakra-ui.com/docs/components/concepts/overview`
- Next.js Server and Client Components: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Guardrails

1. Do not run `prettier`.
2. Do not change `package.json` without explicit user confirmation.
3. Do not add, remove, or update dependencies without explicit user confirmation.
4. Do not change `tsconfig.json`, `eslint.config.js`, or `next.config.ts` without explicit user confirmation.
5. Prefer import aliases such as `@components` and `@utils`.
6. Keep Pages Router and App Router behavior working throughout the migration.
7. Run validation incrementally instead of waiting for a final all-at-once cleanup.

## Risk summary

| Risk | Level | Notes |
|------|-------|-------|
| Provider and color mode behavior changes | High | Current setup uses `cookieStorageManager`, `cookieStorageManagerSSR`, `colorModeManager`, and `resetCSS={false}`. Chakra v3 commonly uses snippet providers and `next-themes`. |
| `@choc-ui/chakra-autocomplete` compatibility | High | This package is Chakra v2-oriented and is used by 6 select inputs. It may need replacement with Chakra v3 `Combobox`, `Select`, or `TagsInput`. |
| Modal migration | High | Chakra v2 `Modal` becomes v3 `Dialog`; structure and open handlers change. |
| Form migration | High | `FormControl` becomes `Field.Root`; labels, helper text, and error text move under `Field`. |
| Toast migration | Medium/High | Many files use `useToast`; v3 uses toaster snippets. A compatibility wrapper may reduce churn. |
| Mechanical prop renames | Medium | `colorScheme`, `isDisabled`, `isLoading`, `isInvalid`, and `isOpen` appear frequently. |
| Icon migration | Low/Medium | `@chakra-ui/icons` is removed in v3. The project already has `react-icons`. |
| Visual regressions | High | Most frontend surfaces depend on Chakra components and style props. |

## Migration phases

### Phase 0: Baseline and codemod spike

Effort: Small

Goals:

1. Create a dedicated migration branch.
2. Run baseline checks:
   - `yarn lint`
   - `yarn typecheck`
3. Run the Chakra codemod only in a disposable branch or temporary worktree.
4. Inspect the resulting diff with git and classify changes into mechanical, risky, and manual buckets.
5. Keep or discard the codemod patch after review. Do not treat the codemod output as merge-ready.

Acceptance criteria:

1. The current failure baseline is known.
2. Any codemod changes are isolated in a disposable branch/worktree until reviewed.
3. The team has confirmed whether dependency changes can proceed.

**Status:** Complete — see [chakra-v3-phase-0-report.md](./chakra-v3-phase-0-report.md). Codemod spike lives on branch `chakra-v3/codemod-spike` in worktree `.worktrees/codemod-spike` (not merge-ready).

### Phase 1: Dependencies and generated snippets

Effort: Small/Medium

Requires explicit confirmation before changing `package.json`.

Expected dependency work from the Chakra migration guide:

1. Update `@chakra-ui/react`.
2. Update `@emotion/react`.
3. Remove `@chakra-ui/icons`.
4. Remove `@emotion/styled` only if it is not used elsewhere.
5. Remove `framer-motion` only if it is not used elsewhere.
6. Add Chakra v3 snippets with the Chakra CLI if the project chooses the snippet-based provider/toaster/color-mode pattern.

Acceptance criteria:

1. Dependency changes are intentional and reviewed.
2. Lockfile changes are limited to the approved package changes.
3. No unrelated config changes are included.

**Status:** In progress.

Completed in branch:

1. `@chakra-ui/react` updated to `^3.35.0`.
2. `@chakra-ui/icons` removed from `package.json`.
3. `@emotion/styled` removed from `package.json`.
4. Lockfile updated.

Still pending in this phase:

1. Decide whether to keep `framer-motion` long-term. It is still used by `components/Utils/AnimatedNumber.tsx`.
2. Replace `@choc-ui/chakra-autocomplete`, or temporarily isolate it, because it still expects Chakra v2 and requests `@emotion/styled`. **Resolved:** package upgraded to `^6.2.2` with Chakra v3 support.
3. Decide whether any snippet files beyond the toaster should be added, or whether local wrappers are enough.

### Phase 2: Provider, theme, and color mode

Effort: Medium/High

Tasks:

1. Convert `utils/theme.ts` from `extendTheme` to Chakra v3 `createSystem`.
2. Wrap token values with `{ value: ... }`.
3. Replace provider usage:
   - `ChakraProvider theme={theme}` becomes `ChakraProvider value={system}` or the project provider snippet.
4. Update both entry points:
   - `pages/_app.tsx`
   - `app/providers.tsx`
5. Decide how to preserve dark mode behavior currently driven by cookies.
6. Confirm whether `resetCSS={false}` behavior needs a v3 equivalent or a CSS reset audit.

Acceptance criteria:

1. Pages Router pages render.
2. App Router pages render.
3. Dark mode does not flash or hydrate incorrectly.
4. `yarn typecheck` reaches component-level migration errors instead of provider/theme errors.

**Status:** Partially complete.

Completed in branch:

1. `utils/theme.ts` now exports `system` created via `createSystem(defaultConfig, ...)`.
2. `pages/_app.tsx` now uses `ChakraProvider value={system}`.
3. `app/providers.tsx` now uses `ChakraProvider value={system}`.
4. Old `cookieStorageManager`, `cookieStorageManagerSSR`, and `colorModeManager` usage was removed.
5. Dark mode is forced with `className="dark"` on `<html>` (Chakra v3 `.dark` condition) plus `ColorModeProvider` (`next-themes`, `forcedTheme="dark"`) in `_app.tsx` / `app/providers.tsx`. `data-theme="dark"` is kept for compatibility but is not sufficient alone.

Still pending in this phase:

1. Browser verification that Pages Router and App Router routes still behave correctly with the new provider setup.
2. Audit whether anything relied on the old `resetCSS={false}` behavior and now needs explicit CSS adjustment.

### Phase 3: Compatibility helpers

Effort: Medium

Create local wrappers only where they materially reduce repeated migration work.

Candidates:

1. Toast wrapper to replace `useToast` call sites with a stable project API.
2. Dialog wrapper for common modal structure, if modal migration becomes repetitive.
3. Field wrapper for common `FormControl` + `FormLabel` + `FormHelperText` patterns.
4. Icon mapping file for Chakra icon replacements using `react-icons`.

Acceptance criteria:

1. Wrappers live under existing project boundaries, for example `@components` or `@utils`.
2. Wrappers do not hide large behavior differences that need deliberate handling.
3. New wrappers have a narrow API and are documented with usage examples in the PR.

**Status:** Partially complete.

Completed in branch:

1. Toast compatibility wrapper added at `utils/toast.ts`.
2. Toaster renderer added at `components/ui/toaster.tsx`.
3. Icon compatibility mapping added at `utils/chakraIcons.tsx`.

Not started yet:

1. Dialog wrapper decision.
2. Field wrapper decision.

### Phase 4: Low-risk mechanical changes

Effort: Medium

Tasks:

1. Replace `colorScheme` with `colorPalette`.
2. Replace `Divider` with `Separator`.
3. Replace `@chakra-ui/icons` imports with `react-icons` equivalents.
4. Replace simple boolean props where the component API remains otherwise similar:
   - `isDisabled` -> `disabled`
   - `isLoading` -> `loading`
   - `isInvalid` -> `invalid`
   - `isRequired` -> `required`
   - `isReadOnly` -> `readOnly`
5. Replace simple button icon props where needed:
   - `leftIcon`
   - `rightIcon`
   - `icon`

Acceptance criteria:

1. These changes are mostly mechanical.
2. Each PR keeps the changed component category small.
3. Type errors decrease without introducing broad visual rewrites.

**Status:** Started, not stabilized.

What has happened already:

1. A bulk pass of mechanical renames was applied across many files.
2. This reduced some v2 prop noise, but also mixed together files that still need compound migrations.

Guidance for continuing this phase:

1. Do not do more blind bulk rewrites before checking the current `yarn typecheck` output.
2. Prefer targeted follow-up edits by family:
   - icon buttons
   - Chakra `Link` usages with `isExternal` / `prefetch`
   - `Text size`
   - `useDisclosure` return shape changes
3. Keep future mechanical passes scoped and validated immediately after each pass.

### Phase 5: Compound component migrations

Effort: Large

Migrate component families in separate PRs.

Suggested order:

1. `Card`:
   - `Card` -> `Card.Root`
   - `CardBody` -> `Card.Body`
   - `CardHeader` -> `Card.Header`
   - `CardFooter` -> `Card.Footer`
2. Lists:
   - `OrderedList` / `UnorderedList` / `ListItem` / `ListIcon` -> `List.Root`, `List.Item`, `List.Indicator`
3. `Menu`:
   - `Menu` -> `Menu.Root`
   - `MenuButton` -> `Menu.Trigger`
   - `MenuList` -> `Menu.Content`
   - `MenuItem` -> `Menu.Item`
   - Add `Portal` and `Menu.Positioner` where appropriate.
4. `Tabs`:
   - `Tabs` -> `Tabs.Root`
   - `TabList` -> `Tabs.List`
   - `Tab` -> `Tabs.Trigger`
   - `TabPanel` -> `Tabs.Content`
   - Add explicit `value` props.
5. `Accordion`:
   - `Accordion` -> `Accordion.Root`
   - `AccordionItem` -> `Accordion.Item`
   - `AccordionButton` -> `Accordion.ItemTrigger`
   - `AccordionPanel` -> `Accordion.ItemContent` / `Accordion.ItemBody`
   - Add explicit `value` props.
6. `Checkbox`, `Radio`, `Slider`, `NumberInput`, and `PinInput`.

**Status:** In progress.

| Family | Status |
|--------|--------|
| `Card`, `Breadcrumb`, `List`, `Tabs` | Done in shared clusters (`Card/*`, `Breadcrumbs`, `ImportInfo`, restock, search filters, …) |
| `Menu` | Done in `SortSelect`, all `UserLists` menu surfaces; pending in `MyListsCard`, `ItemCtxMenu`, `AuthButton`, … |
| `NumberInput` | Done in `CustomNumber`, `EditableFields`; pending in unmigrated modals |
| `Checkbox` | Done in input, restock, import, `EditableFields`; pending in unmigrated modals and item surfaces |
| `Accordion`, table namespaces | Mostly pending |

Acceptance criteria:

1. Each family compiles before moving to the next.
2. Components with controlled state still preserve their previous behavior.
3. Keyboard and focus behavior is tested for interactive components.

### Phase 6: Modal and dialog migration

Effort: Large

Tasks:

1. Replace Chakra v2 `Modal` usage with Chakra v3 `Dialog`.
2. Update structure:
   - `Modal` -> `Dialog.Root`
   - `ModalOverlay` -> `Dialog.Backdrop`
   - `ModalContent` -> `Dialog.Content` inside `Dialog.Positioner`
   - `ModalHeader` -> `Dialog.Header` plus `Dialog.Title` where appropriate
   - `ModalBody` -> `Dialog.Body`
   - `ModalFooter` -> `Dialog.Footer`
   - `ModalCloseButton` -> `Dialog.CloseTrigger`
3. Update props:
   - `isOpen` -> `open`
   - `onClose` -> `onOpenChange`
   - `isCentered` -> `placement="center"`
   - `closeOnOverlayClick` -> `closeOnInteractOutside`
   - `closeOnEsc` -> `closeOnEscape`
4. Verify all modal close paths:
   - close button
   - escape key
   - overlay click
   - successful form submit
   - cancellation buttons

Acceptance criteria:

1. Every modal opens and closes correctly.
2. Focus is restored or intentionally handled.
3. Scroll behavior still works for large modals.
4. Search, list, price, feedback, restock, and admin modals are manually checked.

**Status:** Complete for `components/Modal/*`. All modal files use v3 `Dialog` (or `role="alertdialog"`). **Next:** pages and remaining shared clusters.

### Phase 7: Forms and validation UI

Effort: Large

Tasks:

1. Replace `FormControl` with `Field.Root`.
2. Replace `FormLabel` with `Field.Label`.
3. Replace `FormHelperText` with `Field.HelperText`.
4. Replace `FormErrorMessage` with `Field.ErrorText`.
5. Map props:
   - `isInvalid` -> `invalid`
   - `isRequired` -> `required`
   - `isDisabled` -> `disabled`
   - `isReadOnly` -> `readOnly`
6. Use `Fieldset` for fieldset/legend patterns.

Acceptance criteria:

1. Labels remain associated with inputs.
2. Error text renders only when intended.
3. Form layout remains stable in modals and dense admin views.

**Status:** In progress. `Field` adopted in tools pages, import flow, price modals, restock, and search filters. Dense forms in unmigrated modals (`EditItemModal`, `CreateListModal`, …) remain.

### Phase 8: Autocomplete/select replacement

Effort: Large

Affected files:

1. `components/Input/ItemSelect.tsx`
2. `components/Input/SpeciesSelect.tsx`
3. `components/Input/ItemStatusSelect.tsx`
4. `components/Input/TagsSelect.tsx`
5. `components/Input/ItemCategorySelect.tsx`
6. `components/Input/NeoColorSelect.tsx`

Options:

1. Replace `@choc-ui/chakra-autocomplete` with Chakra v3 `Combobox`.
2. Use Chakra v3 `Select` for simpler fixed-option selectors.
3. Use Chakra v3 `TagsInput` for multi-value tag-style fields.
4. Build one project-level wrapper for all autocomplete-like inputs.

Recommended approach:

1. Start with the simplest select component.
2. Build a project wrapper only after two migrations reveal the stable shared API.
3. Preserve current props and callbacks where possible to avoid rewriting parent pages.

Acceptance criteria:

1. Single-select and multi-select behavior is preserved.
2. Creatable item/tag behavior is preserved where currently supported.
3. Keyboard navigation works.
4. Empty, loading, and no-results states are handled.

**Status:** Complete. All 6 `*Select.tsx` files use `@choc-ui/chakra-autocomplete@^6.2.2` with Chakra v3 Input variants (`subtle`) and `isLoading` prop.

### Phase 9: Route and domain QA

Effort: Large

Use the step-by-step checklist in [browser-qa-test-plan.md](./browser-qa-test-plan.md), including mandatory side-by-side comparison with production at [itemdb.com.br](https://itemdb.com.br).

Manual checks should cover:

1. Home page.
2. Search page and search modal.
3. Item detail page.
4. User lists and official lists.
5. List import flows.
6. Restock hub, shop pages, history pages, and dashboard pages.
7. Feedback trade pages.
8. Login flow.
9. Admin item/price flows.
10. Tools pages.
11. Static App Router pages such as `/privacy` and `/terms`.

Each route should be checked in every supported locale.

Acceptance criteria:

1. No browser console errors.
2. No hydration errors.
3. Menus, modals, toasts, popovers, tabs, accordions, and forms work in the browser.
4. Layout and spacing remain acceptable on mobile and desktop.

### Phase 10: Final validation

Effort: Medium

Run:

```bash
yarn lint
yarn typecheck
```

Run tests based on the touched surface:

```bash
yarn test
```

For frontend-heavy PRs, also run the dev server and inspect key routes in the browser:

```bash
yarn dev
```

Do not run `yarn build` unless the change explicitly needs production build validation or the user confirms it.

Acceptance criteria:

1. Lint passes.
2. Typecheck passes.
3. Relevant tests pass.
4. Browser QA passes.
5. Remaining known issues are documented before merging.

## Suggested PR breakdown

1. Baseline report and codemod spike notes.
2. Dependencies and provider/theme setup.
3. Icons, `colorPalette`, `Separator`, and simple prop renames.
4. Toast compatibility layer.
5. Form/Field migration.
6. Modal/Dialog migration.
7. Menu/Popover/Tabs/Accordion migration.
8. Card/List/Checkbox/NumberInput and remaining component families.
9. Autocomplete/select replacement.
10. Route QA fixes and cleanup.

## Definition of done

The migration is complete when:

1. `@chakra-ui/react` is on v3.
2. `@chakra-ui/icons` is no longer used.
3. No Chakra v2-only components or props remain.
4. `utils/theme.ts` uses Chakra v3 system configuration.
5. Both Pages Router and App Router entry points use the v3 provider pattern.
6. All Chakra-dependent routes render without console or hydration errors.
7. `yarn lint` and `yarn typecheck` pass.
8. Relevant tests pass.
9. Manual QA for the route list in this document is complete.

## Open decisions

1. Color mode direction is currently resolved for this branch as forced dark mode. Revisit only if product requirements change.
2. Should `@choc-ui/chakra-autocomplete` be replaced entirely in the same migration, or isolated behind a temporary wrapper first?
3. Toast wrapper is already in place. Dialog and Field wrappers are still open decisions.
4. Should `next.config.ts` add `optimizePackageImports` for `@chakra-ui/react` after the migration? This requires explicit confirmation because it changes project config.
5. Should `framer-motion` remain if used outside Chakra, or be removed as part of the dependency cleanup?
