-- AlterTable
ALTER TABLE `ItemProcess` ADD COLUMN `type` ENUM('np', 'nc', 'pb') NOT NULL DEFAULT 'np';

-- AlterTable
ALTER TABLE `Items` ADD COLUMN `type` ENUM('np', 'nc', 'pb') NOT NULL DEFAULT 'np';
