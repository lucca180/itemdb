/*
  Warnings:

  - You are about to drop the column `image_id` on the `itemprices` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `itemprices` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `itemprices` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ItemPrices_name_addedAt_idx` ON `itemprices`;

-- DropIndex
DROP INDEX `ItemPrices_name_image_id_idx` ON `itemprices`;

-- DropIndex
DROP INDEX `ItemPrices_name_item_iid_idx` ON `itemprices`;

-- AlterTable
ALTER TABLE `itemprices` DROP COLUMN `image_id`,
    DROP COLUMN `item_id`,
    DROP COLUMN `name`,
    ADD COLUMN `newPrice` DECIMAL(11, 0) NULL;
