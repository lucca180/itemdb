/*
  Warnings:

  - Made the column `status` on table `Items` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `price` to the `PriceProcess` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ItemProcess` ADD COLUMN `isWearable` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Items` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `PriceProcess` ADD COLUMN `price` INTEGER NOT NULL,
    MODIFY `stock` INTEGER NOT NULL DEFAULT 1;
