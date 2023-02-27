/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `ItemProcess` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash]` on the table `PriceProcess` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ItemProcess` ADD COLUMN `hash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PriceProcess` ADD COLUMN `hash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ItemProcess_hash_key` ON `ItemProcess`(`hash`);

-- CreateIndex
CREATE UNIQUE INDEX `PriceProcess_hash_key` ON `PriceProcess`(`hash`);
