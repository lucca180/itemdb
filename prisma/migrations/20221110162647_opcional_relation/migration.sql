-- DropForeignKey
ALTER TABLE `ItemTranslation` DROP FOREIGN KEY `ItemTranslation_item_id_fkey`;

-- AlterTable
ALTER TABLE `ItemTranslation` ADD COLUMN `image_id` VARCHAR(191) NULL,
    MODIFY `item_id` INTEGER NULL,
    MODIFY `category` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ItemTranslation` ADD CONSTRAINT `ItemTranslation_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `Item`(`item_id`) ON DELETE SET NULL ON UPDATE CASCADE;
