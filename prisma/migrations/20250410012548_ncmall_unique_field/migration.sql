/*
  Warnings:

  - A unique constraint covering the columns `[item_iid,active]` on the table `NcMallData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `ncmalldata` DROP FOREIGN KEY `NcMallData_item_iid_fkey`;

-- DropIndex
DROP INDEX `NcMallData_item_iid_active_idx` ON `ncmalldata`;

-- Convert active to accept null

ALTER TABLE `ncmalldata` CHANGE COLUMN `active` `active` TINYINT(1) NULL DEFAULT NULL;

-- Convert false to null

UPDATE `ncmalldata` SET `active` = NULL WHERE `active` = 0;

-- CreateIndex
CREATE UNIQUE INDEX `NcMallData_item_iid_active_key` ON `NcMallData`(`item_iid`, `active`);