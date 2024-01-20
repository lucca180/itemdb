-- CreateTable
CREATE TABLE `LastSeen` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `lastSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LastSeen_item_iid_idx`(`item_iid`),
    UNIQUE INDEX `LastSeen_item_iid_type_key`(`item_iid`, `type`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceProcess2` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `owner` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `otherInfo` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 1,
    `price` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NULL,
    `neo_id` INTEGER NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `PriceProcess2_hash_key`(`hash`),
    INDEX `PriceProcess2_item_iid_idx`(`item_iid`),
    INDEX `PriceProcess2_item_iid_addedAt_idx`(`item_iid`, `addedAt`),
    INDEX `PriceProcess2_item_iid_addedAt_type_idx`(`item_iid`, `addedAt`, `type`),
    UNIQUE INDEX `PriceProcess2_type_neo_id_key`(`type`, `neo_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestockAuctionHistory` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `owner` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `otherInfo` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 1,
    `price` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NULL,
    `neo_id` INTEGER NULL,

    UNIQUE INDEX `RestockAuctionHistory_hash_key`(`hash`),
    INDEX `RestockAuctionHistory_item_iid_idx`(`item_iid`),
    INDEX `RestockAuctionHistory_item_iid_addedAt_idx`(`item_iid`, `addedAt`),
    INDEX `RestockAuctionHistory_item_iid_addedAt_type_idx`(`item_iid`, `addedAt`, `type`),
    UNIQUE INDEX `RestockAuctionHistory_type_neo_id_key`(`type`, `neo_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LastSeen` ADD CONSTRAINT `LastSeen_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceProcess2` ADD CONSTRAINT `PriceProcess2_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestockAuctionHistory` ADD CONSTRAINT `RestockAuctionHistory_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
