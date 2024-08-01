-- AlterTable
ALTER TABLE `salestats` ADD COLUMN `isLatest` BOOLEAN NULL;

-- CreateIndex
CREATE INDEX `SaleStats_item_iid_isLatest_idx` ON `SaleStats`(`item_iid`, `isLatest`);
