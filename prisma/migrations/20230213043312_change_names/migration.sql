/*
  Warnings:

  - You are about to drop the column `addedAt` on the `UserList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `UserList` DROP COLUMN `addedAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
