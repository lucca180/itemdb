/*
  Warnings:

  - Made the column `species_name` on table `wearabledata` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `WearableData_item_iid_zone_label_species_name_key` ON `wearabledata`;

-- AlterTable
ALTER TABLE `wearabledata` MODIFY `species_name` VARCHAR(191) NOT NULL DEFAULT '';
