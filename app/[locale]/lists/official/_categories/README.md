# Official list categories

Config-driven category pages at `/lists/official/<slug>`. Each category is a TS config in this folder;
content rarely changes, so there is no CMS. Copy (kicker, tagline, intro, FAQ, titles, labels) is
written in English directly in the config; UI strings live in the `OfficialCategory` translation namespace.

## Files

```
_categories/
  types.ts      # OfficialCategoryConfig, ListMatch, layouts, sections
  resolve.ts    # resolveCategory(config, lists), resolveSections(config), listLabels
  index.ts      # registry, getOfficialCategory(slug), getOfficialCategoryByTag(tag), reserved slugs
  quest-log.ts  # layout 'tracks'
  events.ts     # Festival of Neggs, Altador Cup — layout 'editions'
  fallback.ts   # Dailies, Advent Calendar, Stamps — no curation yet ("All lists")
../_components/
  OfficialCategoryPage.tsx    # server: route helpers, data, metadata, FAQPage JSON-LD
  OfficialCategoryClient.tsx  # UI
../<slug>/page.tsx            # one static route per category (const SLUG = '<slug>')
```

To add a category: create the config, add it to `categories` in `index.ts`, and copy any
`../<slug>/page.tsx` into a new folder named after the slug (change `SLUG`). The sitemap, list
breadcrumbs (via `tags`) and the slug guard pick it up from the registry;
`test/officialCategories.test.ts` fails if the registry and the folders drift apart.

## Routing

Official lists and categories share `/lists/official/<x>`. Each category is a **static** folder
(`official/quest-log/page.tsx`, …), and a static segment wins over the dynamic
`/lists/[username]/[list_id]`, which keeps serving every official list as before (the same rule
that makes `/lists/official` hit `official/page.tsx`).

- A category folder hides an official list with the same slug. `createListSlug` never gives an
  official list a category slug or a `RESERVED_OFFICIAL_SLUGS` entry (it appends `-2`).
- Before adding a category, check the database (read-only) for an official list already using
  that slug and rename it.
- `/lists/official/cat/<slug>` 308-redirects to the new URL. `/lists/official?cat=<tag>` is unchanged
  and still used for loose tags (event cards, tools).

## Config

- `tags`: `official_tag` values (case-insensitive) loaded for the page. A tag belongs to one category.
- `ListMatch`: exact `slugs` and/or `slugPrefix` (string or array), case-insensitive.
- `archive?: ListMatch`: forced into the collapsed archive regardless of layout.
- `layout`:
  - **`tracks`**: current list(s) + history per track (e.g. Quest Log weekly / daily / NeoPass).
    `history.title` / `.description` are used as written (fallback `"<title> · past pools"`);
    `label` is the badge on the featured card (fallback `title`). A track without `history` only adds
    a featured card.
  - **`editions`**: lists grouped by year (`seriesStart` UTC year, else a standalone year in the slug).
    The newest edition is always the hero, even after it ends. `evergreen` = lists for every edition;
    `editionOrder` = order inside a year by slug prefix; `editionDates: { [year]: { start, end? } }`
    (`YYYY-MM-DD`, UTC) wins over the lists' dates, no `end` → "Since <start>".
  - **`groups`**: free groups by match. `groups: []` = everything under "All lists".
- Lists matched by no rule go to "Other lists": nothing disappears from the page.
- `labels: { match, label, color? }[]`: per-list badges (e.g. "Special week"), with a colored edge on
  pool cards. **Do not use `list.highlight` as a label**: it is the title of the highlighted items
  _inside_ the list (e.g. "Premium" on Festival of Neggs 2026), not a label for the whole list.
- `sections: SectionSlot[]`: order below the hero (`featured`, `intro`, `main`, `other`, `archive`,
  `faq`, `related`); an array renders side by side. Missing ones are appended in `DEFAULT_SECTIONS`
  order. `featured` overlaps the hero only when it comes first.
- `faq` (also emitted as `FAQPage` JSON-LD), `relatedArticles` (WordPress slugs; section hidden when
  empty), `seoTitle`, `description`, `kicker`, `tagline`, `intro`.

## Not done yet

- `/lists/official/<category>/<year>` edition pages.
- Curated layouts for Dailies, Advent Calendar and Stamps.
- Dates on past edition rows.
