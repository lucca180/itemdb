-- AlterTable
ALTER TABLE `items` ADD COLUMN `canonical_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Items` ADD CONSTRAINT `Items_canonical_id_fkey` FOREIGN KEY (`canonical_id`) REFERENCES `Items`(`internal_id`) ON DELETE SET NULL ON UPDATE CASCADE;
