-- AlterTable
ALTER TABLE `listtags` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `isNameVisible` BOOLEAN NOT NULL DEFAULT true;
