-- CreateTable
CREATE TABLE `PetpetColors` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `color_id` INTEGER NOT NULL,
    `petpet_id` INTEGER NOT NULL,
    `item_iid` INTEGER NOT NULL,
    `isUnpaintable` BOOLEAN NOT NULL DEFAULT false,
    `inCanonical` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `PetpetColors_color_id_petpet_id_key`(`color_id`, `petpet_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PetpetColors` ADD CONSTRAINT `PetpetColors_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
