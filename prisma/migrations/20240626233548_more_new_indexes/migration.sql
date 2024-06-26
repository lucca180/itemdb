-- DropIndex
DROP INDEX `PriceProcess2_addedAt_item_iid_processed_idx` ON `priceprocess2`;

-- CreateIndex
CREATE INDEX `ItemProcess_manual_check_processed_idx` ON `ItemProcess`(`manual_check`, `processed`);

-- CreateIndex
CREATE INDEX `PriceProcess2_addedAt_processed_idx` ON `PriceProcess2`(`addedAt`, `processed`);

-- CreateIndex
CREATE INDEX `PriceProcess2_item_iid_addedAt_processed_idx` ON `PriceProcess2`(`item_iid`, `addedAt`, `processed`);

-- CreateIndex
CREATE INDEX `Trades_hash_addedAt_idx` ON `Trades`(`hash`, `addedAt`);
