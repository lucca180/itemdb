-- CreateIndex
CREATE INDEX `ItemPrices_item_iid_idx` ON `ItemPrices`(`item_iid`);

-- CreateIndex
CREATE INDEX `PriceProcess_type_name_addedAt_processed_idx` ON `PriceProcess`(`type`, `name`, `addedAt`, `processed`);
