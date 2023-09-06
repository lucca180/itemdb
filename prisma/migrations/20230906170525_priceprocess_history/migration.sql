-- CreateTable
CREATE TABLE `PriceProcessHistory` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PriceProcessHistory_name_checkedAt_idx`(`name`, `checkedAt`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
