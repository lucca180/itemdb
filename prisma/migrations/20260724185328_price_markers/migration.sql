-- CreateTable
CREATE TABLE `ManualPriceMarker` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `badgeText` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(9) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `isPoint` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManualPriceMarkerItem` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `marker_id` INTEGER NOT NULL,
    `item_iid` INTEGER NOT NULL,

    INDEX `ManualPriceMarkerItem_item_iid_idx`(`item_iid`),
    UNIQUE INDEX `ManualPriceMarkerItem_marker_id_item_iid_key`(`marker_id`, `item_iid`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ManualPriceMarker` ADD CONSTRAINT `ManualPriceMarker_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPriceMarkerItem` ADD CONSTRAINT `ManualPriceMarkerItem_marker_id_fkey` FOREIGN KEY (`marker_id`) REFERENCES `ManualPriceMarker`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPriceMarkerItem` ADD CONSTRAINT `ManualPriceMarkerItem_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
