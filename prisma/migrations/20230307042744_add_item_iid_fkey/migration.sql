-- DropIndex
DROP INDEX `ItemPrices_price_addedAt_idx` ON `ItemPrices`;

-- AlterTable
ALTER TABLE `ItemPrices` ADD COLUMN `item_iid` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ItemPrices` ADD CONSTRAINT `ItemPrices_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
