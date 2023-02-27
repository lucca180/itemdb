/*
  Warnings:

  - You are about to drop the column `oficial` on the `UserList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `UserList` DROP COLUMN `oficial`,
    ADD COLUMN `official` BOOLEAN NOT NULL DEFAULT false;
