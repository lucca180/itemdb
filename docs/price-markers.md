# Price Markers

Price markers are the dated context shown in an item's price history: colored
ranges and points on the chart, and marker rows interleaved with prices in the
table. They come from two sources:

| Source | Origin | Resolver |
| --- | --- | --- |
| Official lists | `UserList` with `official = 1` and a `seriesType` (lists tagged `Avatar` are excluded) | `resolveOfficialListMarkers` |
| Manual markers | `ManualPriceMarker` rows linked to items via `ManualPriceMarkerItem`, managed in `/admin/price-markers` | `resolveManualMarkers` |

Both resolvers live in `app/server/items/priceMarkers.ts` and return
presentation-ready `PriceMarker`s (`startAt`, `endAt`, `isPoint`, labels, color).
The table and chart do no date validation of their own.

---

## Dates and time zone

- Series and marker dates are entered as calendar days and stored at **18:00 UTC**
  (`new UTCDate(value).setHours(18)`), so they land on the same day in
  America/Los_Angeles.
- Every "same day" / "future day" decision compares **LA calendar days**, not
  timestamps. Comparing timestamps would hide "today" until 18:00 UTC.

---

## Official list markers

### Start date

Per-item values (`ListItems.seriesStart` / `seriesEnd`) override the list values.

| `seriesType` | Start |
| --- | --- |
| `listCreation` | item `seriesStart`, else `list.createdAt` |
| `itemAddition` | item `seriesStart`, else item `addedAt` (falls back to `list.createdAt`) |
| `listDates` | item `seriesStart`, else `list.seriesStart`; no start → no marker |
| `null` | no marker |

### End date

Item `seriesEnd`, else `list.seriesEnd`, else open (`endAt: null`).

### Visibility rules

Applied in order:

1. Invalid start or end date → hidden.
2. **Start on a future LA day → hidden** (the series has not happened yet).
3. **End on a future LA day → end is dropped.** The series is ongoing, so it
   renders as an open range (`endAt: null`) until the end day arrives.
4. End before or equal to the item's `firstSeen` → hidden (the window closed
   before the item existed).
5. Start is clamped to `firstSeen` (`startAt = max(firstSeen, start)`).

### Point vs. range

`isPoint` is true when:

- start and end fall on the same LA day (single-day series), or
- the list is `itemAddition` and has **no stored end**.

An `itemAddition` series whose end was dropped by rule 3 stays a **range**: the
decision uses the stored `seriesEnd`, not the dropped one.

A single-day series keeps a valid `endAt` (bumped 1 ms past the start when
needed) so table ordering still works; the chart uses `isPoint` instead.

---

## Manual markers

Admin-provided `title`, `description`, `badgeText`, `color` and `isPoint` pass
through as-is.

### Write path (`app/api/admin/price-markers/priceMarkersService.ts`)

- Dates are normalized to 18:00 UTC.
- A same-LA-day start/end is saved as a point (`isPoint = true`, `endAt = null`).
- `isPoint` markers never store an end.
- `endAt` before `startAt` is rejected.
- At least one of `badgeText`, `title` or `description` is required.
- `badgeText`: `null` = automatic translated badge, `""` = no badge, other = custom text.

### Visibility rules

1. Invalid dates → hidden.
2. Same-LA-day range → point.
3. **Start or end on a future LA day → hidden as a whole.** Unlike official
   lists, a future end is not dropped.
4. End before or equal to `firstSeen` → hidden.
5. Start is clamped to `firstSeen`.
6. No `title`, `description` or `badgeText` → hidden.

---

## Rendering

### Chart (`components/Charts/priceChartModel.ts`)

- **Points** snap to the first price on or after their start day (or the last
  price) and are drawn as contextual dots.
- **Ranges** become colored area segments from `startAt` to `endAt`. With
  `endAt: null` the range stays open through the latest price.
- When ranges overlap, the one that starts later wins for that day.

### Table (`app/_components/Item/Price/itemPriceUtils.ts`)

- Each marker adds a **start** row and, when `endAt` is set, an **end** row.
- Adjacent start and end rows of the same marker (no prices between them)
  collapse into a single range row.
- Price rows between a start and its end are tinted with the marker color.
- Automatic badges:

| Row | Badge |
| --- | --- |
| Start, has end | "Available at" |
| Start, open | "Added to" |
| End | "Unavailable at" |
| Collapsed, same day | "Only Available On" |
| Collapsed, multiple days | "Available at" |

- On truncated tables (summary slice), edges **older than the earliest visible
  price** are dropped so old markers don't pile up at the bottom. Edges newer
  than the latest price are kept and render at the top (e.g. an event that
  started after the last recorded price). A range that started before the
  slice shows only its end row.

---

## Caching

The item page loads markers through `loadItemPriceMarkers`
(`app/_components/Item/loadUtils.ts`), a `'use cache'` function with
`cacheLife('itemFast')` and the item's `markers` / `lists` section tags.

- "Today" is evaluated when the cache entry is built, so a series whose start
  or end day just arrived appears only after the entry revalidates (up to ~10 min).
- Manual marker create/update/delete revalidates the affected items' tags
  immediately.
