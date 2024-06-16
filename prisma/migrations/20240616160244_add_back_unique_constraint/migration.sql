/*
  Warnings:

  - A unique constraint covering the columns `[item_iid,zone_label,species_name]` on the table `WearableData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `WearableData_item_iid_zone_label_species_name_key` ON `WearableData`(`item_iid`, `zone_label`, `species_name`);
