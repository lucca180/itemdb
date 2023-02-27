-- AlterTable
ALTER TABLE `ItemProcess` ADD COLUMN `ip_address` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `Items` RENAME INDEX `Item_item_id_key` TO `Items_item_id_key`;
