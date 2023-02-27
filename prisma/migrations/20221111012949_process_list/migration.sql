-- AlterTable
ALTER TABLE `Item` ADD COLUMN `weight` INTEGER NULL;

-- CreateTable
CREATE TABLE `ItemProcessList` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `image_id` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `rarity` INTEGER NULL,
    `weight` INTEGER NULL,
    `isNC` BOOLEAN NOT NULL,
    `est_val` INTEGER NOT NULL DEFAULT 0,
    `specialType` VARCHAR(191) NULL,
    `releaseDate` DATETIME(3) NULL,
    `retiredDate` DATETIME(3) NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `language` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ItemProcessList_item_id_key`(`item_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
