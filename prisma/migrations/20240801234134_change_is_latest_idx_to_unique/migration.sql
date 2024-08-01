/*
  Warnings:

  - A unique constraint covering the columns `[item_iid,isLatest]` on the table `OwlsPrice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[item_iid,isLatest]` on the table `SaleStats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `OwlsPrice_item_iid_isLatest_idx` ON `owlsprice`;

-- DropIndex
DROP INDEX `SaleStats_item_iid_isLatest_idx` ON `salestats`;

-- CreateIndex
CREATE UNIQUE INDEX `OwlsPrice_item_iid_isLatest_key` ON `OwlsPrice`(`item_iid`, `isLatest`);

-- CreateIndex
CREATE UNIQUE INDEX `SaleStats_item_iid_isLatest_key` ON `SaleStats`(`item_iid`, `isLatest`);
