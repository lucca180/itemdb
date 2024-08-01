-- AlterTable
ALTER TABLE `owlsprice` ADD COLUMN `isLatest` BOOLEAN NULL;

-- CreateIndex
CREATE INDEX `OwlsPrice_item_iid_isLatest_idx` ON `OwlsPrice`(`item_iid`, `isLatest`);
