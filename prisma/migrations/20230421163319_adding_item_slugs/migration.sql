/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Items` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Items` ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Items_slug_key` ON `Items`(`slug`);
