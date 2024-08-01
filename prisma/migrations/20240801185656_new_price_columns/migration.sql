/*
  Warnings:

  - A unique constraint covering the columns `[item_iid,isLatest]` on the table `ItemPrices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `itemprices` ADD COLUMN `isLatest` BOOLEAN NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ItemPrices_item_iid_isLatest_key` ON `ItemPrices`(`item_iid`, `isLatest`);
