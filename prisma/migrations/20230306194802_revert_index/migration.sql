-- DropIndex
DROP INDEX `ItemPrices_item_id_name_image_id_idx` ON `ItemPrices`;

-- CreateIndex
CREATE INDEX `ItemPrices_name_image_id_idx` ON `ItemPrices`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `ItemPrices_item_id_idx` ON `ItemPrices`(`item_id`);
