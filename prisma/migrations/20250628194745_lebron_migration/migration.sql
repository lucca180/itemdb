-- AlterTable
ALTER TABLE `owlsprice` ADD COLUMN `isVolatile` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'owls';
