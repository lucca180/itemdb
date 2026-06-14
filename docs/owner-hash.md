# Owner Hash Collection

`ownerHash` is a lowercase hexadecimal SHA-256 of the normalized Neopets username
(`trim().toLowerCase()`). It is collected alongside the existing masked `owner`
value and is not returned by public APIs.

## Current phase

The current phase only collects and propagates the hash. Existing behavior must
continue using the masked `owner` string until the review date.

- Review date: 2026-12-11
- Active tables: `Trades`, `PriceProcess2`, `RestockAuctionHistory`
- Legacy rows are not backfilled.
- Synthetic owners such as `restock` and `restock-haggle` do not receive a hash.

## Future identity migration

The following uses treat `owner` as an identity and are candidates to use
`ownerHash` after collection coverage and legacy fallback rules are reviewed:

| Behavior | Current location |
| --- | --- |
| Trade relisting history | `utils/tradeRelisting.ts` |
| Similar trade suppression | `pages/api/v1/trades/index.ts` |
| Duplicate owner filtering during pricing | `utils/prices/pricing.ts`, `utils/prices/pricing3.ts` |
| Unique owner counts | `pages/api/v1/items/[id_name]/[tradings].ts`, `pages/api/v1/prices/[iid]/status.ts` |
| Shop, trade, and auction sale grouping | `pages/api/v1/items/[id_name]/saleStats.ts` |
| Price observation deduplication | `pages/api/v1/prices/index.ts` |

Display-only uses must continue using masked `owner`, including trade and auction
history tables. Synthetic-owner checks must also continue using `owner`.

Before changing identity behavior, define how mixed legacy and hashed records are
handled and verify that enough rows contain `ownerHash`.
