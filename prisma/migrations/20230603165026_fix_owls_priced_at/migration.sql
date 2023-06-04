/*
  Warnings:

  - Made the column `pricedAt` on table `OwlsPrice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `OwlsPrice` MODIFY `pricedAt` DATETIME(3) NOT NULL;
