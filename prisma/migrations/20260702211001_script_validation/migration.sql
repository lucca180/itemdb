-- CreateTable
CREATE TABLE `HashValidationKey` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `validatorName` VARCHAR(191) NOT NULL,
    `versionCode` INTEGER NOT NULL,
    `secret` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `revokedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HashValidationKey_validatorName_versionCode_active_idx`(`validatorName`, `versionCode`, `active`),
    UNIQUE INDEX `HashValidationKey_validatorName_versionCode_key`(`validatorName`, `versionCode`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
