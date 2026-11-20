-- CreateTable
CREATE TABLE `ListContext` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `list_id` INTEGER NOT NULL,
    `badgeText` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `color` VARCHAR(9) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ListContext_list_id_idx`(`list_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListContextItem` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `context_id` INTEGER NOT NULL,
    `listItem_id` INTEGER NOT NULL,

    INDEX `ListContextItem_listItem_id_idx`(`listItem_id`),
    UNIQUE INDEX `ListContextItem_context_id_listItem_id_key`(`context_id`, `listItem_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ListContext` ADD CONSTRAINT `ListContext_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `UserList`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListContextItem` ADD CONSTRAINT `ListContextItem_context_id_fkey` FOREIGN KEY (`context_id`) REFERENCES `ListContext`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListContextItem` ADD CONSTRAINT `ListContextItem_listItem_id_fkey` FOREIGN KEY (`listItem_id`) REFERENCES `ListItems`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
