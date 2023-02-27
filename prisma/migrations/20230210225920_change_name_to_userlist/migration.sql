/*
  Warnings:

  - You are about to drop the `ItemList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ItemList` DROP FOREIGN KEY `ItemList_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `ListItems` DROP FOREIGN KEY `ListItems_list_id_fkey`;

-- DropTable
DROP TABLE `ItemList`;

-- CreateTable
CREATE TABLE `UserList` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `user_id` VARCHAR(191) NULL,
    `cover_url` VARCHAR(2200) NULL,
    `oficial` BOOLEAN NOT NULL DEFAULT false,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserList` ADD CONSTRAINT `UserList_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListItems` ADD CONSTRAINT `ListItems_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `UserList`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
