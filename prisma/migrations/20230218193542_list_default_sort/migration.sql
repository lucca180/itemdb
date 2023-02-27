/*
  Warnings:

  - Made the column `order` on table `UserList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sortBy` on table `UserList` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `UserList` MODIFY `order` VARCHAR(191) NOT NULL DEFAULT 'asc',
    MODIFY `sortBy` VARCHAR(191) NOT NULL DEFAULT 'name';
