-- CreateTable
CREATE TABLE `apiKeys` (
    `key_id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_key` VARCHAR(191) NOT NULL,
    `limit` INTEGER NOT NULL DEFAULT 5000,
    `name` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,
    `user_id` VARCHAR(191) NULL,

    UNIQUE INDEX `apiKeys_api_key_key`(`api_key`),
    PRIMARY KEY (`key_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `apiKeys` ADD CONSTRAINT `apiKeys_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
