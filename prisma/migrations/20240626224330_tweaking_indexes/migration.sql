-- DropIndex
DROP INDEX `PriceProcess2_addedAt_processed_idx` ON `priceprocess2`;

-- DropIndex
DROP INDEX `PriceProcess2_item_iid_addedAt_processed_idx` ON `priceprocess2`;

-- DropIndex
DROP INDEX `Trades_hash_processed_idx` ON `trades`;

-- CreateIndex
CREATE INDEX `PriceProcess2_addedAt_processed_item_iid_idx` ON `PriceProcess2`(`addedAt`, `processed`, `item_iid`);

-- CreateIndex
CREATE INDEX `Trades_processed_hash_idx` ON `Trades`(`processed`, `hash`);
