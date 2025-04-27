/*
  Warnings:

  - You are about to drop the column `tagId` on the `userlist` table. All the data in the column will be lost.
  - You are about to drop the `listtags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `listtags` DROP FOREIGN KEY `ListTags_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `userlist` DROP FOREIGN KEY `UserList_tagId_fkey`;

-- DropIndex
DROP INDEX `UserList_tagId_fkey` ON `userlist`;

-- AlterTable
ALTER TABLE `userlist` DROP COLUMN `tagId`,
    ADD COLUMN `canBeLinked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `listUserTag` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `listtags`;
