/*
  Warnings:

  - You are about to drop the `ItemLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Items` MODIFY `image` VARCHAR(2200) NULL;

-- DropTable
DROP TABLE `ItemLog`;

-- CreateTable
CREATE TABLE `ItemList` (
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

-- CreateTable
CREATE TABLE `ListItems` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `list_id` INTEGER NOT NULL,
    `item_iid` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `capValue` INTEGER NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemList` ADD CONSTRAINT `ItemList_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListItems` ADD CONSTRAINT `ListItems_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListItems` ADD CONSTRAINT `ListItems_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `ItemList`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
