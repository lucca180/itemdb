-- CreateTable
CREATE TABLE `OpenableQueue` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_name` VARCHAR(191) NOT NULL,
    `parent_image` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `limitedEdition` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
