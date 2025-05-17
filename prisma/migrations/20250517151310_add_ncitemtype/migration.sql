/*
  Warnings:

  - Added the required column `type` to the `NCTradeItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `nctradeitems` ADD COLUMN `type` ENUM('offered', 'received') NOT NULL;
