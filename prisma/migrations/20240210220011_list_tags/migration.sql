-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `official_tag` VARCHAR(191) NULL,
    ADD COLUMN `tagId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ListTags` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserList` ADD CONSTRAINT `UserList_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `ListTags`(`internal_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListTags` ADD CONSTRAINT `ListTags_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
