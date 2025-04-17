-- CreateTable
CREATE TABLE `ActionLogs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `actionType` VARCHAR(191) NOT NULL,
    `logText` JSON NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,

    INDEX `ActionLogs_actionType_addedAt_idx`(`actionType`, `addedAt`),
    INDEX `ActionLogs_user_id_actionType_idx`(`user_id`, `actionType`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActionLogs` ADD CONSTRAINT `ActionLogs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
