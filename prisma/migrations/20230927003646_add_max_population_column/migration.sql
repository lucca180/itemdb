-- AlterTable
ALTER TABLE `itemcolor` ADD COLUMN `isMaxPopulation` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `ItemColor_image_id_isMaxPopulation_idx` ON `ItemColor`(`image_id`, `isMaxPopulation`);
