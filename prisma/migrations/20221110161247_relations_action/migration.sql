-- DropForeignKey
ALTER TABLE `ItemTranslation` DROP FOREIGN KEY `ItemTranslation_item_id_fkey`;

-- AddForeignKey
ALTER TABLE `ItemTranslation` ADD CONSTRAINT `ItemTranslation_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `Item`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
