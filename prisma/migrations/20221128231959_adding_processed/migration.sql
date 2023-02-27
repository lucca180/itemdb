/*
  Warnings:

  - You are about to drop the column `manual_check` on the `PriceProcess` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ItemPrices_item_id_fkey` ON `ItemPrices`;

-- AlterTable
ALTER TABLE `ItemPrices` ADD COLUMN `manual_check` VARCHAR(191) NULL,
    ADD COLUMN `usedProcessIDs` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PriceProcess` DROP COLUMN `manual_check`,
    ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `ItemPrices_name_image_id_idx` ON `ItemPrices`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `ItemProcess_name_image_id_idx` ON `ItemProcess`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `ItemTranslation_name_image_id_idx` ON `ItemTranslation`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `Items_name_image_id_idx` ON `Items`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `PriceProcess_name_image_id_idx` ON `PriceProcess`(`name`, `image_id`);
