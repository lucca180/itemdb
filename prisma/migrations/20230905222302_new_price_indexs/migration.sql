-- CreateIndex
CREATE INDEX `ItemPrices_name_addedAt_idx` ON `ItemPrices`(`name`, `addedAt`);

-- CreateIndex
CREATE INDEX `ItemPrices_name_idx` ON `ItemPrices`(`name`);

-- CreateIndex
CREATE INDEX `ItemPrices_name_item_iid_idx` ON `ItemPrices`(`name`, `item_iid`);

-- CreateIndex
CREATE INDEX `PriceProcess_name_addedAt_idx` ON `PriceProcess`(`name`, `addedAt`);

-- CreateIndex
CREATE INDEX `PriceProcess_name_addedAt_type_idx` ON `PriceProcess`(`name`, `addedAt`, `type`);

-- CreateIndex
CREATE INDEX `PriceProcess_name_idx` ON `PriceProcess`(`name`);
