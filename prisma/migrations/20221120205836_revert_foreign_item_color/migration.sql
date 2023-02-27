/*
  Warnings:

  - You are about to drop the column `item_iid` on the `ItemColor` table. All the data in the column will be lost.
  - You are about to drop the column `population` on the `ItemColor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ItemColor` DROP FOREIGN KEY `ItemColor_item_iid_fkey`;

-- AlterTable
ALTER TABLE `ItemColor` DROP COLUMN `item_iid`,
    DROP COLUMN `population`;
