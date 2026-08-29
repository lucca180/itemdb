-- CreateTable
CREATE TABLE `PetpetSpecies` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `neo_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PetpetSpecies_neo_id_key`(`neo_id`),
    INDEX `PetpetSpecies_name_idx`(`name`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PetpetColorCatalog` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `neo_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PetpetColorCatalog_neo_id_key`(`neo_id`),
    INDEX `PetpetColorCatalog_name_idx`(`name`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
