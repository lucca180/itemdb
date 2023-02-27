/*
  Warnings:

  - Added the required column `name` to the `ItemPrices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ItemPrices` DROP FOREIGN KEY `ItemPrices_item_id_fkey`;

-- AlterTable
ALTER TABLE `ItemPrices` ADD COLUMN `image_id` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `ItemProcess` MODIFY `status` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Items` MODIFY `status` VARCHAR(191) NULL;
