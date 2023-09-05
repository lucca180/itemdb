-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `dynamicType` ENUM('addOnly', 'removeOnly', 'fullSync') NULL;
