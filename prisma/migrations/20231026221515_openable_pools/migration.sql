-- AlterTable
ALTER TABLE `openableitems` ADD COLUMN `isManual` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `prizePool` VARCHAR(191) NULL;
