-- CreateTable
CREATE TABLE `saleStats` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `stats` ENUM('ets', 'regular', 'hts') NOT NULL,
    `totalItems` INTEGER NOT NULL,
    `totalSold` INTEGER NOT NULL,
    `daysPeriod` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saleStats_item_iid_addedAt_idx`(`item_iid`, `addedAt`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `saleStats` ADD CONSTRAINT `saleStats_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
