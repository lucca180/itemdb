/*
  Warnings:

  - Made the column `usedProcessIDs` on table `ItemPrices` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ItemPrices` MODIFY `usedProcessIDs` TEXT NOT NULL;
