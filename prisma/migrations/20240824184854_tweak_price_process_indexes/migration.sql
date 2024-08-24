-- DropIndex
DROP INDEX `PriceProcess2_addedAt_processed_idx` ON `priceprocess2`;

-- DropIndex
DROP INDEX `PriceProcess2_item_iid_addedAt_processed_idx` ON `priceprocess2`;

-- CreateIndex
CREATE INDEX `PriceProcess2_addedAt_processed_item_iid_idx` ON `PriceProcess2`(`addedAt`, `processed`, `item_iid`);

-- CreateIndex
CREATE INDEX `PriceProcess2_item_iid_processed_addedAt_idx` ON `PriceProcess2`(`item_iid`, `processed`, `addedAt`);
