/*
  Warnings:

  - You are about to drop the column `descripton` on the `Tags` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Tags` DROP COLUMN `descripton`,
    ADD COLUMN `description` TEXT NULL;
