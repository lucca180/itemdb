-- CreateTable
CREATE TABLE `RestockWrapped` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sessionText` LONGTEXT NOT NULL,

    UNIQUE INDEX `RestockWrapped_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WrappedSettings` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL DEFAULT 2024,
    `user_id` VARCHAR(191) NOT NULL,
    `ready` BOOLEAN NOT NULL DEFAULT false,
    `settings` LONGTEXT NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WrappedSettings_user_id_year_key`(`user_id`, `year`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RestockWrapped` ADD CONSTRAINT `RestockWrapped_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrappedSettings` ADD CONSTRAINT `WrappedSettings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
