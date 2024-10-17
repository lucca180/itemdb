-- AlterTable
ALTER TABLE `trades` ALTER COLUMN `isAllItemsEqual` DROP DEFAULT;

UPDATE `trades` SET `isAllItemsEqual` = NULL;