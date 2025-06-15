-- CreateTable
CREATE TABLE `ncValues` (
    `value_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `valueRange` VARCHAR(191) NOT NULL,
    `minValue` INTEGER NOT NULL,
    `maxValue` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL,
    `processedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastChangeCheck` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valueContext` JSON NULL,
    `isLatest` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ncValues_item_iid_addedAt_idx`(`item_iid`, `addedAt`),
    UNIQUE INDEX `ncValues_item_iid_isLatest_key`(`item_iid`, `isLatest`),
    PRIMARY KEY (`value_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ncValues` ADD CONSTRAINT `ncValues_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
