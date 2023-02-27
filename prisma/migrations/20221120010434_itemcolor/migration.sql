-- AlterTable
ALTER TABLE `ItemProcess` MODIFY `est_val` INTEGER NULL;

-- AlterTable
ALTER TABLE `Items` MODIFY `est_val` INTEGER NULL;

-- CreateTable
CREATE TABLE `ItemColor` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `h` DOUBLE NOT NULL,
    `s` DOUBLE NOT NULL,
    `l` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
