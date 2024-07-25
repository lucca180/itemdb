-- DropForeignKey
ALTER TABLE `salestats` DROP FOREIGN KEY `saleStats_item_iid_fkey`;

-- AddForeignKey
ALTER TABLE `SaleStats` ADD CONSTRAINT `SaleStats_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `salestats` RENAME INDEX `saleStats_item_iid_addedAt_idx` TO `SaleStats_item_iid_addedAt_idx`;
