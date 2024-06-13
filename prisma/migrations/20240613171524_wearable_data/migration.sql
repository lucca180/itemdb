-- CreateTable
CREATE TABLE `WearableData` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `zone_label` VARCHAR(191) NULL,
    `zone_plain_label` VARCHAR(191) NULL,
    `species_name` VARCHAR(191) NULL,
    `isCanonical` BOOLEAN NOT NULL DEFAULT false,

    INDEX `WearableData_item_iid_isCanonical_idx`(`item_iid`, `isCanonical`),
    INDEX `WearableData_zone_plain_label_species_name_idx`(`zone_plain_label`, `species_name`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WearableData` ADD CONSTRAINT `WearableData_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
