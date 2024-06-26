-- DropIndex
DROP INDEX `PriceProcess2_addedAt_processed_item_iid_idx` ON `priceprocess2`;

-- CreateIndex
CREATE INDEX `PriceProcess2_addedAt_item_iid_processed_idx` ON `PriceProcess2`(`addedAt`, `item_iid`, `processed`);
