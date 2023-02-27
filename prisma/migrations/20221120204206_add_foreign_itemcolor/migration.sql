/*
  Warnings:

  - Added the required column `item_iid` to the `ItemColor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `population` to the `ItemColor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ItemColor` ADD COLUMN `item_iid` INTEGER NOT NULL,
    ADD COLUMN `population` DOUBLE NOT NULL;

-- AddForeignKey
ALTER TABLE `ItemColor` ADD CONSTRAINT `ItemColor_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
