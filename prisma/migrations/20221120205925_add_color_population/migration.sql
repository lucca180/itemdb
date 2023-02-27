/*
  Warnings:

  - Added the required column `population` to the `ItemColor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ItemColor` ADD COLUMN `population` DOUBLE NOT NULL;
