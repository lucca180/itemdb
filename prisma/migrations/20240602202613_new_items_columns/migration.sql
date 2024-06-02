-- AlterTable
ALTER TABLE `items` ADD COLUMN `canEat` ENUM('true', 'unknown', 'false') NOT NULL DEFAULT 'unknown',
    ADD COLUMN `canOpen` ENUM('true', 'unknown', 'false') NOT NULL DEFAULT 'unknown',
    ADD COLUMN `canPlay` ENUM('true', 'unknown', 'false') NOT NULL DEFAULT 'unknown',
    ADD COLUMN `canRead` ENUM('true', 'unknown', 'false') NOT NULL DEFAULT 'unknown';
