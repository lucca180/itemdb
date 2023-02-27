/*
  Warnings:

  - You are about to drop the column `noInflaction_id` on the `ItemPrices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ItemPrices` RENAME COLUMN `noInflaction_id` TO `noInflation_id`;
