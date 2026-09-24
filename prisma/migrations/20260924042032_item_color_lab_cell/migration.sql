-- AlterTable
ALTER TABLE `itemcolor` ADD COLUMN `lab_cell` INTEGER NULL;

-- CreateIndex
CREATE INDEX `ItemColor_lab_cell_population_lab_l_lab_a_lab_b_image_id_idx` ON `ItemColor`(`lab_cell`, `population`, `lab_l`, `lab_a`, `lab_b`, `image_id`);
