/*
  Warnings:

  - A unique constraint covering the columns `[slug,user_id]` on the table `UserList` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserList_slug_user_id_key` ON `UserList`(`slug`, `user_id`);
