/*
  Warnings:

  - You are about to drop the column `order` on the `UserList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `UserList` RENAME COLUMN `order` TO `sortDir`;
