/*
  Warnings:

  - A unique constraint covering the columns `[map_id]` on the table `PetpetColorCatalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[map_id]` on the table `PetpetSpecies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `petpetcolorcatalog` ADD COLUMN `map_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `petpetspecies` ADD COLUMN `map_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PetpetColorCatalog_map_id_key` ON `PetpetColorCatalog`(`map_id`);

-- CreateIndex
CREATE UNIQUE INDEX `PetpetSpecies_map_id_key` ON `PetpetSpecies`(`map_id`);
