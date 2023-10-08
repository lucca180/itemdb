/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `Trades` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `trades` ADD COLUMN `hash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Trades_hash_key` ON `Trades`(`hash`);
