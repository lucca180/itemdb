-- DropIndex
DROP INDEX `PriceProcess2_item_iid_addedAt_type_idx` ON `priceprocess2`;

-- CreateIndex
CREATE INDEX `PriceProcess2_item_iid_addedAt_processed_idx` ON `PriceProcess2`(`item_iid`, `addedAt`, `processed`);
