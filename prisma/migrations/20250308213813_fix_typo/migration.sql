/*
  Warnings:

  - You are about to drop the column `inCanonical` on the `petpetcolors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `petpetcolors` DROP COLUMN `inCanonical`,
    ADD COLUMN `isCanonical` BOOLEAN NOT NULL DEFAULT false;
