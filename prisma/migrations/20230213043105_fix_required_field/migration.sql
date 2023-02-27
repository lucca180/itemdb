/*
  Warnings:

  - Made the column `user_id` on table `UserList` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `UserList` DROP FOREIGN KEY `UserList_user_id_fkey`;

-- AlterTable
ALTER TABLE `UserList` MODIFY `user_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `UserList` ADD CONSTRAINT `UserList_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
