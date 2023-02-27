/*
  Warnings:

  - A unique constraint covering the columns `[neo_user]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `neo_user` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `neo_user` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_neo_user_key` ON `User`(`neo_user`);
