-- CreateTable
CREATE TABLE `PetStyle` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `species_id` INTEGER NULL,
    `series` VARCHAR(191) NOT NULL,
    `color_id` INTEGER NULL,
    `isPrismatic` BOOLEAN NOT NULL DEFAULT false,
    `prismaticVariant` VARCHAR(191) NULL,
    `needsReview` BOOLEAN NOT NULL DEFAULT false,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PetStyle_item_iid_key`(`item_iid`),
    INDEX `PetStyle_needsReview_idx`(`needsReview`),
    INDEX `PetStyle_species_id_series_idx`(`species_id`, `series`),
    INDEX `PetStyle_series_idx`(`series`),
    INDEX `PetStyle_species_id_color_id_idx`(`species_id`, `color_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PetStyleAvailability` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `style_id` INTEGER NOT NULL,
    `availableBegin` DATETIME(3) NULL,
    `availableEnd` DATETIME(3) NULL,
    `active` BOOLEAN NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PetStyleAvailability_active_availableEnd_idx`(`active`, `availableEnd`),
    UNIQUE INDEX `PetStyleAvailability_style_id_active_key`(`style_id`, `active`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PetStyle` ADD CONSTRAINT `PetStyle_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetStyleAvailability` ADD CONSTRAINT `PetStyleAvailability_style_id_fkey` FOREIGN KEY (`style_id`) REFERENCES `PetStyle`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
