-- CreateIndex
CREATE INDEX `ItemColor_hsv_h_idx` ON `ItemColor`(`hsv_h`);

-- CreateIndex
CREATE INDEX `ItemPrices_item_id_idx` ON `ItemPrices`(`item_id`);

-- CreateIndex
CREATE INDEX `ItemPrices_addedAt_idx` ON `ItemPrices`(`addedAt`);

-- CreateIndex
CREATE INDEX `Items_image_id_idx` ON `Items`(`image_id`);

-- CreateIndex
CREATE INDEX `Items_item_id_idx` ON `Items`(`item_id`);

-- CreateIndex
CREATE INDEX `PriceProcess_item_id_idx` ON `PriceProcess`(`item_id`);

-- CreateIndex
CREATE INDEX `PriceProcess_addedAt_idx` ON `PriceProcess`(`addedAt`);
