-- CreateTable
CREATE TABLE `ItemColor` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `lab_l` DOUBLE NOT NULL,
    `lab_a` DOUBLE NOT NULL,
    `lab_b` DOUBLE NOT NULL,
    `hsv_h` DOUBLE NOT NULL,
    `hsv_s` DOUBLE NOT NULL,
    `hsv_v` DOUBLE NOT NULL,
    `rgb_r` DOUBLE NOT NULL,
    `rgb_g` DOUBLE NOT NULL,
    `rgb_b` DOUBLE NOT NULL,
    `hex` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `population` DOUBLE NOT NULL,

    UNIQUE INDEX `ItemColor_image_id_type_key`(`image_id`, `type`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
