-- CreateTable
CREATE TABLE `NcMallData` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `saleBegin` DATETIME(3) NULL,
    `saleEnd` DATETIME(3) NULL,
    `discountBegin` DATETIME(3) NULL,
    `discountEnd` DATETIME(3) NULL,
    `discountPrice` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NcMallData_item_iid_active_idx`(`item_iid`, `active`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NcMallData` ADD CONSTRAINT `NcMallData_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
