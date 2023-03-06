-- DropIndex
DROP INDEX `ItemPrices_addedAt_idx` ON `ItemPrices`;

-- DropIndex
DROP INDEX `ItemPrices_item_id_idx` ON `ItemPrices`;

-- DropIndex
DROP INDEX `ItemPrices_name_image_id_idx` ON `ItemPrices`;

-- DropIndex
DROP INDEX `ItemPrices_price_idx` ON `ItemPrices`;

-- CreateIndex
CREATE INDEX `ItemPrices_item_id_name_image_id_idx` ON `ItemPrices`(`item_id`, `name`, `image_id`);

-- CreateIndex
CREATE INDEX `ItemPrices_price_addedAt_idx` ON `ItemPrices`(`price` ASC, `addedAt` DESC);
