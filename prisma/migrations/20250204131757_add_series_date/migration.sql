/*
  Warnings:

  - The values [itemRemoval] on the enum `UserList_seriesType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `seriesEnd` DATETIME(3) NULL,
    ADD COLUMN `seriesStart` DATETIME(3) NULL,
    MODIFY `seriesType` ENUM('listCreation', 'itemAddition', 'listDates') NULL;
