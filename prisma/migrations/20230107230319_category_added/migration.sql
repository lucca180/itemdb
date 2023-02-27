/*
  Warnings:

  - You are about to drop the column `status` on the `ItemTags` table. All the data in the column will be lost.
  - You are about to drop the column `votes` on the `ItemTags` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Tags` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `Tags` table. All the data in the column will be lost.
  - Added the required column `name` to the `Tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateAt` to the `Tags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ItemTags` DROP COLUMN `status`,
    DROP COLUMN `votes`;

-- AlterTable
ALTER TABLE `Tags` DROP COLUMN `tag`,
    DROP COLUMN `used`,
    ADD COLUMN `descripton` TEXT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'tag',
    ADD COLUMN `updateAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `OpenableItems` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `parent_iid` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemTags` ADD CONSTRAINT `ItemTags_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpenableItems` ADD CONSTRAINT `OpenableItems_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpenableItems` ADD CONSTRAINT `OpenableItems_parent_iid_fkey` FOREIGN KEY (`parent_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
