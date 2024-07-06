-- CreateTable
CREATE TABLE `ColorSpecies` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `species_id` INTEGER NOT NULL,
    `color_id` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ColorSpecies_species_id_color_id_key`(`species_id`, `color_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
