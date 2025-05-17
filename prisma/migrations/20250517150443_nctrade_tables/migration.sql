-- CreateTable
CREATE TABLE `NCTrade` (
    `trade_id` INTEGER NOT NULL AUTO_INCREMENT,
    `tradeDate` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NOT NULL,
    `reporter_id` VARCHAR(191) NOT NULL,
    `ip_address` VARCHAR(191) NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`trade_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NCTradeItems` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `trade_id` INTEGER NOT NULL,
    `item_iid` INTEGER NOT NULL,
    `personalValue` VARCHAR(191) NOT NULL,
    `pvMinValue` INTEGER NOT NULL,
    `pvMaxValue` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NCTrade` ADD CONSTRAINT `NCTrade_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NCTradeItems` ADD CONSTRAINT `NCTradeItems_trade_id_fkey` FOREIGN KEY (`trade_id`) REFERENCES `NCTrade`(`trade_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NCTradeItems` ADD CONSTRAINT `NCTradeItems_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
