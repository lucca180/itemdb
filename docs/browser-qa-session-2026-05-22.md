# Browser QA session log — 2026-05-22

**Branch:** Chakra v3 migration (local)  
**Local:** http://localhost:3000 (`yarn dev`, Next.js MCP port 3000)  
**Baseline:** https://itemdb.com.br  
**Tooling:** Next.js DevTools MCP (`get_errors`, `browser_eval` / Playwright)

## URL fixture (this session)

| Type | Slug / query | Prod | Local |
|------|----------------|------|-------|
| Item | `my-first-faerie` | https://itemdb.com.br/item/my-first-faerie | http://localhost:3000/item/my-first-faerie |
| Search | `?q=faerie` | https://itemdb.com.br/search?q=faerie | http://localhost:3000/search?q=faerie |
| Restock hub | — | https://itemdb.com.br/restock | http://localhost:3000/restock |

---

## Summary

| Route | Locale | Prod | Local | Notes |
|-------|--------|------|-------|-------|
| `/` | en | OK | OK | 0 console errors; 1 image aspect-ratio warning |
| `/pt` | pt | — | OK | Loaded; not compared side-by-side this session |
| `/search?q=faerie` | en | — | OK | 401 on `/api/auth/me` (anonymous); LCP warning on logo |
| `/item/my-first-faerie` | en | OK | **OK** (after QA-001 fix) | Re-test UI vs prod |
| `/restock` | en | OK | **OK** (after QA-001 fix) | Re-test UI vs prod |
| `/lists/official` | en | — | **OK** (after QA-001 fix) | Re-test UI vs prod |
| `/feedback` | en | — | **OK** (after QA-001 fix) | Re-test UI vs prod |
| `/login` | en | — | OK | 401 auth/me; LCP warning |

**Next.js MCP `get_errors` (after navigation):** session errors on `/item/my-first-faerie` and `/restock` — `next/image` missing required `width` (and related SSR failure).

---

## Bugs

### QA-001 — P0 — `chakra(NextImage)` drops `width` / `height` (SSR 500)

| Field | Value |
|-------|-------|
| Routes | `/item/*`, `/restock`, `/lists/official`, `/feedback`, likely any page using `@components/Utils/Image` or `HeaderCard` with external `src` |
| Prod URL | https://itemdb.com.br/item/my-first-faerie (works) |
| Expected (prod) | Page renders with hub/NC/external images |
| Actual (local) | HTTP 500; console: `Image with src "…" is missing required "width" property` |
| Root cause (suspected) | `components/Utils/Image.tsx` exports `chakra(NextImage)`. Chakra v3 maps `width`/`height` to CSS; `next/image` requires numeric `width`/`height` props. |
| Example errors | `bookaward_lg.png` (item), `cashshop_limited.png` (restock), `tradingcards/premium/0911.gif` (official lists), `altadorcup/.../help_me_decide.gif` (feedback) |

**Fix (2026-05-22):** Replaced `chakra(NextImage)` in `components/Utils/Image.tsx` with a wrapper that passes `width`/`height`/`fill` to `NextImage` and applies Chakra layout props on a parent `Box`.

**Re-test:** `/item/my-first-faerie`, `/restock`, `/feedback`, `/lists/official` render locally; `get_errors` empty for item route.

### QA-002 — P2 — Image aspect ratio warning (home)

| Field | Value |
|-------|-------|
| Route | `/` |
| Message | `Image with src "/icons/nc.png"` — width or height modified without the other |

### QA-003 — P2 — LCP warning (search / login)

| Field | Value |
|-------|-------|
| Routes | `/search`, `/login` |
| Message | Logo SVG should use `loading="eager"` if above the fold |

### QA-004 — Info — Anonymous `401` on `/api/auth/me`

| Field | Value |
|-------|-------|
| Routes | Multiple |
| Note | Also seen on prod; not a regression |

### QA-005 — Info — Prod hydration warning #418

| Field | Value |
|-------|-------|
| Route | https://itemdb.com.br/item/my-first-faerie |
| Note | Pre-existing on prod; local item page does not render (500) |

---

## P0 / P1 routes not yet tested this session

- `/login` flow completion (magic link)
- `/lists/[user]`, `/lists/[user]/[list_id]`
- `/lists/import`
- `/feedback/trades`
- `/pt/search`, `/pt/item/...`
- Header dropdown interactions (menu)
- Search modal / item context menu
- `/privacy`, `/terms`
- Mobile viewport pass

---

## UI comparison (prod vs local, viewport ~1280px)

Screenshots captured via Playwright during this session (`.playwright-mcp/`).

### `/` (Home)

| Aspect | Prod | Local |
|--------|------|-------|
| Shell | Header, nav, search, login | Same structure |
| Hero | Logo + tagline + “open source” pill | Same |
| Latest Prices | **Different items** (DB/content; e.g. Brown Sugar Oatmeal vs My First Faerie) | Same card layout and gradients |
| Delta | — | Small **“N”** dev indicator bottom-left (Next.js dev only) |
| Verdict | **OK** (layout parity; content differs by data) |

### `/search?q=faerie`

| Aspect | Prod | Local |
|--------|------|-------|
| Layout | Filters sidebar + 5-col grid + sort controls | Matches |
| Filters | Category expanded, grey placeholders | Same |
| Results | “72,682 results”; same first-page items visible | Same |
| Verdict | **OK** — no visible UI regression in viewport |

### `/item/my-first-faerie`

| Aspect | Prod | Local |
|--------|------|-------|
| Page | Full item page: breadcrumbs, tags, 3 columns, prices, restock card | **Next.js error overlay** (white screen) |
| Error | — | `bookaward_lg.png` missing `width` on `next/image` |
| Verdict | **Regression** — no UI to compare; prod is the only usable state |

### `/restock`

| Aspect | Prod | Local |
|--------|------|-------|
| Page | Hero banner (cash shop art), title, category/difficulty pills, trending shops | **Next.js error overlay** |
| Error | — | `cashshop_limited.png` missing `width` |
| Verdict | **Regression** — blocks entire hub UI |

### Chakra v3 visual notes (where pages render)

On home/search, differences vs prod are **subtle** (spacing, button radius) — within expected v2→v3 delta. Broken routes show **no** Chakra layout at all due to SSR crash.

---

## Theme regression fix (2026-05-22)

**Symptom:** Chakra v3 looked like light mode (light gray surfaces, dark text).

**Cause:** Migration set `data-theme="dark"` on `<html>`, but Chakra v3 activates `_dark` semantic tokens only via the **`.dark` class** (`preset-base`: `dark: ".dark &, …"`). Without `.dark`, `:root` matched `_light` tokens.

**Fix:**

- `className="dark"` on `<html>` / `<Html>` (`pages/_document.tsx`, `app/layout.tsx`)
- `ColorModeProvider` with `next-themes` (`forcedTheme="dark"`, `attribute="class"`) in `components/ui/color-mode.tsx`, wired in `_app.tsx` and `app/providers.tsx`
- `globalCss` on `system` for `colorScheme: dark` and semantic `bg`/`fg` on `body`

After fix: `document.documentElement.className === "dark"`, body `rgb(26, 32, 44)`.

---

## Recommended next steps

1. ~~Fix **QA-001**~~ Done (`components/Utils/Image.tsx`).
2. Re-run P0 matrix with prod ↔ local UI comparison on item/restock/feedback/official.
3. Repeat prod ↔ local comparison for fixed routes using the same fixture URLs.
