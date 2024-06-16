/*
  Warnings:

  - Made the column `zone_label` on table `wearabledata` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zone_plain_label` on table `wearabledata` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `wearabledata` MODIFY `zone_label` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `zone_plain_label` VARCHAR(191) NOT NULL DEFAULT '';
