/*
  Warnings:

  - Made the column `map_id` on table `petpetcolorcatalog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `map_id` on table `petpetspecies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `petpetcolorcatalog` MODIFY `map_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `petpetspecies` MODIFY `map_id` INTEGER NOT NULL;
