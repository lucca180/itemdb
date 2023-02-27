-- AlterTable
ALTER TABLE `ListItems` ADD COLUMN `order` INTEGER NULL;

-- AlterTable
ALTER TABLE `UserList` ADD COLUMN `order` VARCHAR(191) NULL DEFAULT 'desc',
    ADD COLUMN `sortBy` VARCHAR(191) NULL DEFAULT 'addedAt';
