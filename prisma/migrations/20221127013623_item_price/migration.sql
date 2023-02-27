-- AlterTable
ALTER TABLE `Items` ADD COLUMN `comment` TEXT NULL,
    ADD COLUMN `isWearable` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ItemPrices` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NULL,
    `price` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceProcess` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `image` TEXT NULL,
    `image_id` VARCHAR(191) NULL,
    `owner` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `otherInfo` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `manual_check` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemPrices` ADD CONSTRAINT `ItemPrices_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `Items`(`item_id`) ON DELETE SET NULL ON UPDATE CASCADE;
