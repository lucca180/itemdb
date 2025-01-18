-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `seriesType` ENUM('listCreation', 'itemAddition', 'itemRemoval') NULL;
