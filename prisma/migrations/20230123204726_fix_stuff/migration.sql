/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Tags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Items` ADD COLUMN `isNeohome` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `Tags_name_key` ON `Tags`(`name`);
