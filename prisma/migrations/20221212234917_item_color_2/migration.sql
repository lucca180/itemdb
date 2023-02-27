-- CreateTable
CREATE TABLE `ItemColorLab` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `l` DOUBLE NOT NULL,
    `a` DOUBLE NOT NULL,
    `b` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `population` DOUBLE NOT NULL,

    UNIQUE INDEX `ItemColorLab_image_id_type_key`(`image_id`, `type`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
