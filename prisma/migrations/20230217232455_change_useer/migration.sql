/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_neo_user_key` ON `User`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL,
    MODIFY `neo_user` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
