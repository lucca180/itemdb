# Browser QA test plan

Manual QA plan for validating itemdb in the browser. Use after frontend changes (UI, i18n, auth, Chakra v3 migration) or before merging PRs that touch routes or shared components.

Related: [chakra-v3-migration.md](./chakra-v3-migration.md) (Phase 9 — Route and domain QA).

---

## Goal

Confirm that main routes render without console or hydration errors, that critical interactions (menus, modals, forms, toasts) work in **en** and **pt**, and that layout remains usable on desktop and mobile.

**Required reference:** compare every route tested locally against the **same URL in production** at [https://itemdb.com.br](https://itemdb.com.br) (and `https://itemdb.com.br/pt/...` when applicable). Production defines expected behavior and appearance for end users; local only passes QA when it matches prod or when the difference is documented as an intentional change.

This plan **does not replace** `yarn test`, `yarn lint`, or `yarn typecheck`; it complements them with visual and behavioral checks.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **Production (baseline)** | [https://itemdb.com.br](https://itemdb.com.br) — keep open in a separate tab/window for the whole session |
| Local environment | `yarn dev` (Turbopack) at `http://localhost:3000` |
| Data | Local DB/API per project `.env`; dynamic content may differ from prod |
| Browsers | Chrome or Edge (primary) + one other (Firefox or Safari) for spot checks |
| Viewports | Desktop (~1280px+) and mobile (~375px); optional tablet (~768px) |
| Locales | `en` (no prefix) and `pt` (`/pt` prefix) — see [utils/locales.ts](../utils/locales.ts) |
| Theme | Forced dark mode (`data-theme="dark"`); no theme toggle on this branch |
| Auth (dev) | Magic link: token printed in terminal on `POST /api/auth/sendLink` — see [auth.md](./auth.md) |
| Test account | User with lists and edit permission on at least one list; admin account for admin flows |

### Useful tools

- DevTools → **Console** (errors, hydration warnings)
- DevTools → **Network** (4xx/5xx on APIs used by the page)
- Browser responsive mode or fixed device dimensions

### Global failure criteria

Mark a route as **failed** if any of the following occur:

1. Red console error (excluding browser extensions)
2. React/Next hydration warning
3. Modal/menu/popover that does not open, close, or is unusable
4. Form that does not submit or show feedback (toast/alert)
5. Broken layout (horizontal overflow, clipped text, unclickable buttons)
6. Link or breadcrumb pointing to the wrong route for the active locale
7. **Regression vs production:** visual or flow difference from [itemdb.com.br](https://itemdb.com.br) without an approved issue/doc (see section below)

---

## Production comparison (itemdb.com.br)

Every QA session should treat **production as the source of truth** for UX, copy, information hierarchy, and flows. Local is the deploy candidate; for each route ask: *“Would a user on itemdb.com.br today notice something wrong or odd here?”*

### Recommended setup

1. **Two tabs or side-by-side windows** — same width (e.g. 1280px desktop, 375px mobile).
2. **Same locale** — local `en` ↔ `https://itemdb.com.br/...`; local `pt` ↔ `https://itemdb.com.br/pt/...`.
3. **Same path** — copy the URL from prod and change only the host:
   - Prod: `https://itemdb.com.br/item/42`
   - Local: `http://localhost:3000/item/42`
4. **Same auth state when relevant** — anonymous vs logged in; use a real prod account only when needed (avoid mutating prod data during write tests).
5. **Hard refresh** on both (`Cmd+Shift+R` / disable cache in DevTools) before comparing layout after deploy or asset changes.

### URL fixture (fill once per session)

Record the same identifiers for prod and local at the start of the session so you are not comparing different pages:

```text
| Type        | ID / slug (from prod) | Prod URL                                      | Local URL                          |
|-------------|-----------------------|-----------------------------------------------|------------------------------------|
| Item        |                       | https://itemdb.com.br/item/                   | http://localhost:3000/item/        |
| List        | user / list_id        | https://itemdb.com.br/lists/.../              | http://localhost:3000/lists/.../   |
| Restock shop|                       | https://itemdb.com.br/restock/                | http://localhost:3000/restock/     |
| Search      | ?q=...                | https://itemdb.com.br/search?q=               | http://localhost:3000/search?q=    |
| Article     | slug                  | https://itemdb.com.br/articles/               | http://localhost:3000/articles/    |
```

Pick **rich** items on prod (NC, prices, tabs, modals) and **long** lists (virtualization) to maximize visual coverage.

### What to compare (per-route checklist)

| Dimension | Compare | Ignore / accept with note |
|-----------|---------|---------------------------|
| **Structure** | Sections present, block order, tabs, breadcrumbs | Empty content if the item does not exist in the local DB |
| **Copy / i18n** | Titles, button labels, placeholders, error messages | Small date/number differences from timezone or data |
| **Typography & color** | Readable sizes, contrast, hierarchy (title vs body) | Minor Chakra v3 theme tweaks if documented in the migration |
| **Spacing** | Obvious breaks, stuck cards, clipped buttons | 1–4px deltas between v2 (prod) and v3 (local) — log as P2 if acceptable |
| **Components** | Modals, menus, tables, filters, toasts — same triggers and outcome | Internal component styling (radius, shadow) if behavior matches |
| **Interaction** | Clicks, hover, Esc, tab order, scroll on tables/long lists | — |
| **Dynamic data** | Price format, badges, links to item/list | Different numeric values or counts (local DB ≠ prod) |
| **SEO / meta** | Tab title, canonical in view source if critical | — |
| **Console** | **Local only** — prod does not block merge, but prod errors help isolate regressions | Browser extension noise |

### Per-route flow (required for P0 and P1)

For each row in the coverage matrix:

1. Open URL on **production** → note state (screenshot optional).
2. Open the **same path** on **local** → compare side by side.
3. Perform the **same action** on both (e.g. open filter, modal, switch tab).
4. Classify:
   - **OK** — equivalent for the user
   - **Accepted delta** — intentional change (e.g. Chakra v3); link to issue/PR
   - **Regression** — worse than prod; file a bug with “Prod vs Local”

### Expected differences during Chakra v3 migration

While prod is still on Chakra v2 and the branch on v3, some visual differences may be **acceptable** if documented:

- `Button`, `Card`, `Input` padding/margin
- Icons (icon package changed)
- Modal/toast animation

**Not** acceptable without approval: modal does not open, menu off-screen, unreadable table, filter does not apply, missing toast, text truncated locally but full on prod.

### Auth and write actions

| Action | Rule |
|--------|------|
| Read (browse, open modals) | Compare prod ↔ local freely |
| Write (create price, edit list, feedback) | Prefer **local only**; if prod flow must be validated, use a dedicated test account and reversible operations |
| Login | Validate **screens and messages** match prod; complete login on local only (magic link in dev) |

### Quick log (prod vs local)

```text
Route: /item/____  Locale: en|pt  Viewport: desktop|mobile
Prod:   [ OK | delta | regression ] — note:
Local:  [ OK | delta | regression ] — note:
Screenshot prod: (optional)  Screenshot local: (optional)
```

---

## Coverage matrix (locale × route)

For each block below, repeat scenarios in **en** and **pt** (switch language via header selector or `/pt/...` URL).

| Priority | Route (en) | Route (pt) | Notes |
|----------|------------|------------|-------|
| P0 | `/` | `/pt` | Home (App Router) |
| P0 | `/search` | `/pt/search` | Search + filters |
| P0 | `/item/[id]` | `/pt/item/[id]` | Known item with price, tags, NC |
| P0 | `/login` | `/pt/login` | Magic link (dev) |
| P1 | `/lists/[user]` | `/pt/lists/[user]` | Public user lists |
| P1 | `/lists/[user]/[list_id]` | same | Edit when logged in as owner |
| P1 | `/lists/official` | `/pt/lists/official` | Official lists |
| P1 | `/lists/import` | `/pt/lists/import` | Basic import |
| P1 | `/restock` | `/pt/restock` | Restock hub |
| P1 | `/restock/[id]` | same | Specific shop |
| P1 | `/feedback` | `/pt/feedback` | General feedback |
| P1 | `/feedback/trades` | same | Trades |
| P2 | `/tools/price-calculator` | `/pt/tools/...` | Calculator |
| P2 | `/tools/rainbow-pool` | same | Rainbow pool |
| P2 | `/tools/api` | same | API docs |
| P2 | `/hub/item-effects` | `/pt/hub/...` | Event hubs |
| P2 | `/articles` | `/pt/articles` | Index + one `[slug]` |
| P3 | `/privacy`, `/terms` | App Router | Static pages |
| P3 | `/404`, `/500` | Error pages | Force invalid URL |
| P3 | `/admin/createItem` | Logged-in admin | Admin role only |

Replace `[id]`, `[user]`, `[list_id]` with real IDs. **Use the same IDs on prod and local** — copy from the URL on [itemdb.com.br](https://itemdb.com.br) before testing on localhost.

---

## Checklist — Global shell (all routes)

Run on at least **Home**, **Search**, and **Item** in both locales.

### Header and navigation

- [ ] Logo goes to home in the correct locale
- [ ] Search bar: type a term, open results / search modal if applicable
- [ ] Header dropdowns open, items are clickable, close on outside click or Esc
- [ ] Language selector: switches `pt` / `en`, URL and content update
- [ ] `LanguageToast` (if shown): accept/dismiss without error
- [ ] Auth button: logged out vs logged in; opens login flow when expected
- [ ] `FeedbackButton` opens feedback modal

### Layout and system

- [ ] No unwanted horizontal scroll on mobile
- [ ] `SiteAlert` (if active) readable and dismissible
- [ ] Loading spinner disappears after data loads
- [ ] Success/error toast appears and dismisses (actions that trigger toast)
- [ ] External links with `target="_blank"` work correctly

### Chakra v3 — shared patterns

Validate on any page that uses the component:

| Pattern | Where to exercise | Verify |
|---------|-------------------|--------|
| `Dialog` | Modals (feedback, lists, price) | Open, focus first field, close via button and Esc |
| `Menu` / `Popover` | Header, `ItemCtxMenu`, `ListSelect` | Positioning, item click, not behind overlay |
| `Tabs` | Item, restock, seen history | Tab switch without losing critical state |
| `Accordion` | FAQ, contribute, feedback vote | Expand/collapse multiple sections |
| `Table` + scroll | Prices, trades, restock history | Horizontal scroll on mobile if needed |
| `Tooltip` | Help icons | Hover/focus shows text |
| `NativeSelect` / autocomplete | Filters, `*Select.tsx` | Open list, select, clear; loading state |
| `Switch` / `Checkbox` | Filters, editable lists | Visual state matches value |
| `NumberInput` | Quantities in lists/import | Increment, typing, limits |

---

## Domain checklists

### 1. Home (`/` and `/pt`)

- [ ] Main cards and links render images and text
- [ ] Navigation to featured hubs/tools works
- [ ] No hydration error on first paint

### 2. Search (`/search`)

- [ ] Search field and filters (`SearchFilters` / filter modal)
- [ ] Pagination or infinite scroll (if enabled)
- [ ] Sorting (`SortSelect`)
- [ ] Open item from result
- [ ] Filters persist or reset per expected UX

### 3. Item (`/item/[id]`)

- [ ] Header: name, image, badges (category/type) clickable
- [ ] Tabs: prices, history, comments, etc.
- [ ] `ItemCtxMenu`: open, actions (lists, report, etc.)
- [ ] Modals: create price, wrong price, last seen, seen history
- [ ] `AddToListSelect` / add to list (logged-in user)
- [ ] Side cards: NC Mall, restock info, recipes, effects — layout OK on mobile

### 4. User lists

**Index** (`/lists/[username]`)

- [ ] List of lists, clickable cards
- [ ] Create list (modal) when logged in as owner

**Detail** (`/lists/[username]/[list_id]`)

- [ ] Public view vs edit mode (owner)
- [ ] `ListViewport` / virtualized list: long scroll without jank
- [ ] Edit fields (`EditableFields`), quantities, sort
- [ ] Export, delete item, confirmation modals
- [ ] `ListPriceHistoryModal`, price history if available

**Official** (`/lists/official`, `/lists/official/cat/[category]`)

- [ ] Categories and items load
- [ ] Official odds modal (if applicable)

**Import** (`/lists/import`, `/lists/import/advanced`)

- [ ] Step-by-step flow, upload/paste data
- [ ] Validation and clear error messages
- [ ] Completion redirects or shows summary

### 5. Restock

- [ ] `/restock`: hub, shop cards, filters
- [ ] `/restock/[id]`: shop items, `RestockItemCard`
- [ ] `/restock/[id]/history`: table/history with scroll
- [ ] Dashboards (`/restock/dashboard`, `2024`, `2025`): charts/cards
- [ ] Modals: import restock, wrapped — open/close
- [ ] Breadcrumbs (`RestockBreadcrumb`) correct in en/pt

### 6. Feedback

- [ ] `/feedback`: listing, submit feedback, policy/reminder
- [ ] `/feedback/trades`: trade calculator/modal, table
- [ ] `/feedback/vote`: accordions, votes (if logged in)
- [ ] Report modal on feedback item

### 7. Tools (`/tools/*`)

| Route | Focus |
|-------|-------|
| `price-calculator` | Numeric inputs, result, reset |
| `rainbow-pool/[[...slug]]` | Species/color navigation, image preview |
| `api` | Tables, examples, links |
| `data-collecting` | Forms and alerts |
| `troubleshooting` | Accordion / static content |

### 8. Hubs and content

- [ ] `/hub/item-effects`, `/hub/missing-info`, seasonal hubs (`faeriefestival`, `the-void-within`, etc.)
- [ ] `/hub/outfits/[species]`: gallery/outfits
- [ ] `/articles` + `/articles/[slug]`: lists, tables, internal links
- [ ] `/contribute`, `/faq`, `/public-data`

### 9. Mall and misc

- [ ] `/mall/leaving`, `/mall/report`
- [ ] `/maintenance` (if enabled in staging)

### 10. Auth (`/login`)

- [ ] Send email/username → in dev, link in terminal
- [ ] Open link with token → session created, redirect
- [ ] New user: set username flow (if applicable)
- [ ] After login `GET /api/auth/me`: header shows user
- [ ] Logout clears session and UI returns to anonymous

### 11. Admin (admin account only)

- [ ] `/admin/createItem`: form, validation, submit
- [ ] Admin price modals on item (if part of daily flow)

### 12. App Router

- [ ] `/privacy` — content, links, locale
- [ ] `/terms` — same
- [ ] Home in `app/page.tsx` consistent with global layout

### 13. Error pages

- [ ] Invalid URL → custom `404`, link to home
- [ ] Simulate `500` if there is a test route or local story

---

## Priority regressions (Chakra v3 migration)

After changes to `@chakra-ui/react` or `components/Modal`, `components/Input`, `components/Menus`:

1. **Search modal** — keyboard shortcut / global open
2. **Item context menu** — position and z-index over cards
3. **Header dropdowns** — `Menu.Root` + `NextLink`
4. **Six `*Select.tsx`** — autocomplete with `isLoading` and `variant="subtle"`
5. **Toasts** — `utils/toast.ts` + `components/ui/toaster.tsx`
6. **Dialogs at scale** — at least one modal per area: lists, item, restock, feedback

---

## Bug log template

Copy one row per issue:

```text
| ID | Date | Route | Locale | Viewport | Prod URL | Steps | Expected (prod) | Actual (local) | Local console | Severity |
|----|------|------|--------|----------|----------|-------|-----------------|----------------|---------------|----------|
| QA-001 | YYYY-MM-DD | /item/123 | pt | mobile | https://itemdb.com.br/pt/item/123 | ... | matches prod | ... | yes/no | P0/P1/P2 |
```

**Suggested severity**

- **P0** — blocks usage (crash, cannot log in, cannot save list/price)
- **P1** — degraded functionality with workaround
- **P2** — minor visual/copy/accessibility

---

## Recommended execution order

For a ~2h session focused on post-migration UI regression:

0. Build **URL fixture** from [itemdb.com.br](https://itemdb.com.br) (item, list, shop, search)
1. Global shell (en) — Home → Search → Item — **each step: prod ↔ local**
2. Repeat shell (pt) — same URLs with `/pt` prefix
3. Lists (public on prod + editable on local only)
4. Restock hub + shop + history (same shop IDs)
5. Feedback + one tool
6. Login — compare screens with prod; complete flow on local
7. Mobile: Search + Item + long list (prod and local at same viewport)
8. Privacy/terms + 404

At the end, record: browsers tested, commit/branch, fixture URLs used, **OK / delta / regression** counts vs prod, and whether `yarn typecheck` / `yarn lint` ran on the branch.

---

## Definition of done (manual QA)

Consider QA for this branch **complete** when:

1. All **P0** and **P1** routes passed in **en** and **pt** on the primary browser
2. **Comparison with [itemdb.com.br](https://itemdb.com.br) finished** on the same routes and fixtures — zero undocumented P0/P1 regressions vs prod
3. **P2** sample has no new P0/P1 failures
4. Mobile checked on P0 routes (prod ↔ local)
5. No console errors on P0/P1 routes (local)
6. Open P0 bugs = 0 (or documented with issue link and prod URL)
7. Aligned with Phase 9 criteria in [chakra-v3-migration.md](./chakra-v3-migration.md#phase-9-route-and-domain-qa)

---

## Changelog

| Date | Author | Notes |
|------|--------|-------|
| 2026-05-22 | — | Initial plan; aligned with Chakra v3 migration Phase 9 |
| 2026-05-22 | — | Mandatory production comparison at itemdb.com.br |
| 2026-05-22 | — | Document translated to English |
