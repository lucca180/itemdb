-- DropIndex
DROP INDEX `ItemPrices_item_id_idx` ON `ItemPrices`;

-- DropIndex
DROP INDEX `ItemPrices_item_id_name_image_id_idx` ON `ItemPrices`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `profile_color` VARCHAR(191) NULL,
    ADD COLUMN `profile_image` VARCHAR(191) NULL;
