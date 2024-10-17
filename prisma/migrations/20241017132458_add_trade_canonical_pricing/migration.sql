/*
  Warnings:

  - A unique constraint covering the columns `[wishlist,isCanonical,isAllItemsEqual,itemsCount]` on the table `Trades` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `trades` ADD COLUMN `isAllItemsEqual` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `isCanonical` BOOLEAN NULL,
    ADD COLUMN `itemsCount` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `Trades_wishlist_isCanonical_isAllItemsEqual_itemsCount_key` ON `Trades`(`wishlist`(300), `isCanonical`, `isAllItemsEqual`, `itemsCount`);
