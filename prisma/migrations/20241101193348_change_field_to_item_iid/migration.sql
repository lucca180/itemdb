/*
  Warnings:

  - You are about to drop the column `item_id` on the `datacollecting` table. All the data in the column will be lost.
  - Added the required column `item_iid` to the `DataCollecting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `datacollecting` DROP FOREIGN KEY `DataCollecting_item_id_fkey`;

-- AlterTable
ALTER TABLE `datacollecting` DROP COLUMN `item_id`,
    ADD COLUMN `item_iid` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `DataCollecting` ADD CONSTRAINT `DataCollecting_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
